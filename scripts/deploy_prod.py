from __future__ import annotations

import argparse
from pathlib import Path, PurePosixPath
import subprocess
import tempfile
import time

from dotenv import dotenv_values
from jinja2 import Environment, FileSystemLoader
import paramiko


ROOT_DIR = Path(__file__).resolve().parents[1]
DEFAULT_ENV_DIR = ROOT_DIR / "scripts" / "deploy"
TEMPLATES_DIR = DEFAULT_ENV_DIR / "templates"
REQUIRED_CONFIG_KEYS = [
    "DEPLOY_HOST",
    "DEPLOY_PORT",
    "DEPLOY_USER",
    "DEPLOY_PASSWORD",
    "DB_HOST",
    "DB_PORT",
    "DB_NAME",
    "DB_USER",
    "DB_PASSWORD",
    "JWT_SECRET",
    "REMOTE_FRONTEND_DIR",
    "REMOTE_BACKEND_DIR",
    "REMOTE_APP_CONFIG",
    "REMOTE_SYSTEMD_FILE",
    "REMOTE_NGINX_FILE",
    "APP_PORT",
    "PUBLIC_BASE_URL",
]


def normalize_config(config: dict[str, str]) -> dict[str, str]:
    normalized = dict(config)
    normalized.setdefault("ENABLE_HTTPS", "false")
    normalized.setdefault(
        "TLS_CERT_PATH",
        f"/etc/letsencrypt/live/{normalized['DEPLOY_HOST']}/fullchain.pem",
    )
    normalized.setdefault(
        "TLS_KEY_PATH",
        f"/etc/letsencrypt/live/{normalized['DEPLOY_HOST']}/privkey.pem",
    )
    normalized["HTTPS_ENABLED"] = str(normalized["ENABLE_HTTPS"]).lower() == "true"
    return normalized


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="AllôTCF 生产部署工具")
    parser.add_argument("--env", default="prod", help="部署环境名，例如 prod")
    return parser.parse_args()


def load_config(env_name: str, env_dir: Path = DEFAULT_ENV_DIR) -> dict[str, str]:
    env_file = env_dir / f".env.{env_name}"
    if not env_file.exists():
        raise FileNotFoundError(f"部署配置文件不存在: {env_file}")

    raw_values = dotenv_values(env_file)
    config = {key: value for key, value in raw_values.items() if value is not None}
    missing_keys = [key for key in REQUIRED_CONFIG_KEYS if not config.get(key)]
    if missing_keys:
        raise ValueError(f"部署配置缺少必填项: {', '.join(missing_keys)}")

    return normalize_config(config)


def build_artifacts(root_dir: Path = ROOT_DIR) -> None:
    subprocess.run(["npm", "run", "build"], cwd=root_dir / "frontend", check=True)
    subprocess.run(
        ["mvn", "clean", "package", "-DskipTests"],
        cwd=root_dir / "backend",
        check=True,
    )


def render_templates(
    config: dict[str, str],
    output_dir: Path,
    templates_dir: Path = TEMPLATES_DIR,
) -> dict[str, Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    env = Environment(loader=FileSystemLoader(str(templates_dir)), autoescape=False)

    rendered_files = {
        "application": output_dir / "application-prod.yml",
        "service": output_dir / "allotcf.service",
        "nginx": output_dir / "allotcf.conf",
    }
    templates = {
        "application": "application-prod.yml.j2",
        "service": "allotcf.service.j2",
        "nginx": "nginx.conf.j2",
    }
    context = normalize_config(config)

    for key, template_name in templates.items():
        rendered = env.get_template(template_name).render(**context)
        rendered_files[key].write_text(rendered.strip() + "\n", encoding="utf-8")

    return rendered_files


def create_ssh_client(config: dict[str, str]) -> paramiko.SSHClient:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(
        hostname=config["DEPLOY_HOST"],
        port=int(config["DEPLOY_PORT"]),
        username=config["DEPLOY_USER"],
        password=config["DEPLOY_PASSWORD"],
        timeout=15,
    )
    return client


def mkdir_p_remote(
    sftp: paramiko.SFTPClient,
    remote_path: str,
    created_paths: set[str] | None = None,
) -> None:
    path = PurePosixPath(remote_path)
    parts = list(reversed(path.parents[:-1])) + [path]
    for part in parts:
        part_str = str(part)
        if created_paths is not None and part_str in created_paths:
            continue
        try:
            sftp.mkdir(part_str)
        except OSError:
            pass
        if created_paths is not None:
            created_paths.add(part_str)


def upload_directory_tree(
    sftp: paramiko.SFTPClient,
    local_dir: Path,
    remote_dir: str,
    created_paths: set[str] | None = None,
) -> None:
    remote_root = PurePosixPath(remote_dir)
    parent_dir = str(remote_root.parent)
    if created_paths is None or parent_dir not in created_paths:
        try:
            sftp.mkdir(parent_dir)
        except OSError:
            pass
        if created_paths is not None:
            created_paths.add(parent_dir)
    root_dir = str(remote_root)
    if created_paths is None or root_dir not in created_paths:
        try:
            sftp.mkdir(root_dir)
        except OSError:
            pass
        if created_paths is not None:
            created_paths.add(root_dir)
    for local_path in sorted(local_dir.rglob("*")):
        if local_path.is_dir():
            relative_dir = local_path.relative_to(local_dir).as_posix()
            mkdir_p_remote(
                sftp,
                str(PurePosixPath(remote_dir) / relative_dir),
                created_paths=created_paths,
            )
            continue

        remote_path = str(PurePosixPath(remote_dir) / local_path.relative_to(local_dir).as_posix())
        sftp.put(str(local_path), remote_path)


def upload_file(
    sftp: paramiko.SFTPClient,
    local_path: Path,
    remote_path: str,
    created_paths: set[str] | None = None,
) -> None:
    mkdir_p_remote(
        sftp,
        str(PurePosixPath(remote_path).parent),
        created_paths=created_paths,
    )
    sftp.put(str(local_path), remote_path)


def upload_deploy_bundle(
    sftp: paramiko.SFTPClient,
    config: dict[str, str],
    *,
    frontend_dist: Path,
    backend_jar: Path,
    rendered_files: dict[str, Path],
) -> None:
    created_paths: set[str] = set()
    upload_directory_tree(
        sftp,
        frontend_dist,
        config["REMOTE_FRONTEND_DIR"],
        created_paths=created_paths,
    )
    upload_file(
        sftp,
        backend_jar,
        str(PurePosixPath(config["REMOTE_BACKEND_DIR"]) / "allotcf.jar"),
        created_paths=created_paths,
    )
    upload_file(
        sftp,
        rendered_files["application"],
        config["REMOTE_APP_CONFIG"],
        created_paths=created_paths,
    )
    upload_file(
        sftp,
        rendered_files["service"],
        config["REMOTE_SYSTEMD_FILE"],
        created_paths=created_paths,
    )
    upload_file(
        sftp,
        rendered_files["nginx"],
        config["REMOTE_NGINX_FILE"],
        created_paths=created_paths,
    )


def run_remote_command(ssh_client: paramiko.SSHClient, command: str) -> str:
    _, stdout, stderr = ssh_client.exec_command(command)
    exit_code = stdout.channel.recv_exit_status()
    stdout_text = stdout.read().decode("utf-8", errors="ignore").strip()
    stderr_text = stderr.read().decode("utf-8", errors="ignore").strip()
    if exit_code != 0:
        error_output = stderr_text or stdout_text or f"命令执行失败: {command}"
        raise RuntimeError(error_output)
    return stdout_text


def run_remote_deploy(ssh_client: paramiko.SSHClient, config: dict[str, str]) -> None:
    backend_root = str(PurePosixPath(config["REMOTE_BACKEND_DIR"]).parent)
    commands = [
        f"chown -R root:root {backend_root} {config['REMOTE_FRONTEND_DIR']} /etc/allotcf",
        "systemctl daemon-reload",
        "systemctl restart allotcf",
        "nginx -t",
        "systemctl restart nginx",
    ]
    for command in commands:
        run_remote_command(ssh_client, command)


def run_health_checks(ssh_client: paramiko.SSHClient, config: dict[str, str]) -> str:
    backend_command = f"curl --silent http://127.0.0.1:{config['APP_PORT']}"
    last_error: RuntimeError | None = None
    for attempt in range(10):
        try:
            run_remote_command(ssh_client, backend_command)
            break
        except RuntimeError as exc:
            last_error = exc
            if attempt == 9:
                raise
            time.sleep(2)

    if config["HTTPS_ENABLED"]:
        frontend_command = (
            "curl --silent --insecure "
            f"--header 'Host: {config['SERVER_NAMES'].split()[0]}' "
            "https://127.0.0.1"
        )
    else:
        frontend_command = "curl --silent http://127.0.0.1"
    run_remote_command(ssh_client, frontend_command)
    return f"部署成功，访问地址：{config['PUBLIC_BASE_URL']}"


def find_backend_jar(root_dir: Path = ROOT_DIR) -> Path:
    candidates = sorted(
        path
        for path in (root_dir / "backend" / "target").glob("*.jar")
        if not path.name.startswith("original-")
    )
    if not candidates:
        raise FileNotFoundError("未找到后端 jar 包，请先完成后端打包。")
    return candidates[-1]


def main() -> int:
    args = parse_args()
    config = load_config(args.env)
    print(f"已加载部署环境: {args.env} -> {config['DEPLOY_HOST']}")

    build_artifacts(ROOT_DIR)

    with tempfile.TemporaryDirectory(prefix="allotcf-deploy-") as temp_dir:
        rendered_files = render_templates(config, Path(temp_dir))
        frontend_dist = ROOT_DIR / "frontend" / "dist"
        backend_jar = find_backend_jar(ROOT_DIR)
        ssh_client = create_ssh_client(config)
        try:
            sftp = ssh_client.open_sftp()
            try:
                upload_deploy_bundle(
                    sftp,
                    config,
                    frontend_dist=frontend_dist,
                    backend_jar=backend_jar,
                    rendered_files=rendered_files,
                )
            finally:
                sftp.close()

            run_remote_deploy(ssh_client, config)
            print(run_health_checks(ssh_client, config))
        finally:
            ssh_client.close()

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
