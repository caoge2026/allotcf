from pathlib import Path
import importlib.util
import io
import types

import pytest


ROOT_DIR = Path(__file__).resolve().parents[2]
SCRIPT_PATH = ROOT_DIR / "scripts" / "deploy_prod.py"


def load_module():
    spec = importlib.util.spec_from_file_location("deploy_prod", SCRIPT_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError("无法加载 deploy_prod.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def write_env(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def base_env_text() -> str:
    return "\n".join(
        [
            "DEPLOY_HOST=47.94.88.161",
            "DEPLOY_PORT=22",
            "DEPLOY_USER=root",
            "DEPLOY_PASSWORD=secret",
            "DB_HOST=47.92.55.242",
            "DB_PORT=3306",
            "DB_NAME=allo",
            "DB_USER=allotcf_app",
            "DB_PASSWORD=db-secret",
            "JWT_SECRET=abcdefghijklmnopqrstuvwxyz123456",
            "REMOTE_FRONTEND_DIR=/var/www/allotcf",
            "REMOTE_BACKEND_DIR=/opt/allotcf/backend",
            "REMOTE_APP_CONFIG=/etc/allotcf/application-prod.yml",
            "REMOTE_SYSTEMD_FILE=/etc/systemd/system/allotcf.service",
            "REMOTE_NGINX_FILE=/etc/nginx/conf.d/allotcf.conf",
            "ENABLE_HTTPS=true",
            "TLS_CERT_PATH=/etc/letsencrypt/live/47.94.88.161/fullchain.pem",
            "TLS_KEY_PATH=/etc/letsencrypt/live/47.94.88.161/privkey.pem",
            "APP_PORT=8080",
            "PUBLIC_BASE_URL=https://47.94.88.161",
        ],
    )


def test_load_config_reads_expected_env_file(tmp_path: Path) -> None:
    module = load_module()
    env_dir = tmp_path / "deploy"
    env_file = env_dir / ".env.prod"
    write_env(env_file, base_env_text())

    config = module.load_config("prod", env_dir=env_dir)

    assert config["DEPLOY_HOST"] == "47.94.88.161"
    assert config["DB_NAME"] == "allo"
    assert config["REMOTE_NGINX_FILE"] == "/etc/nginx/conf.d/allotcf.conf"


def test_load_config_raises_when_env_file_missing(tmp_path: Path) -> None:
    module = load_module()

    with pytest.raises(FileNotFoundError) as exc_info:
        module.load_config("prod", env_dir=tmp_path / "deploy")

    assert ".env.prod" in str(exc_info.value)


def test_load_config_raises_when_required_field_missing(tmp_path: Path) -> None:
    module = load_module()
    env_dir = tmp_path / "deploy"
    env_file = env_dir / ".env.prod"
    write_env(env_file, base_env_text().replace("JWT_SECRET=abcdefghijklmnopqrstuvwxyz123456\n", ""))

    with pytest.raises(ValueError) as exc_info:
        module.load_config("prod", env_dir=env_dir)

    assert "JWT_SECRET" in str(exc_info.value)


def test_build_artifacts_runs_frontend_then_backend(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_module()
    calls: list[tuple[tuple[str, ...], str]] = []

    def fake_run(command, cwd, check):
        calls.append((tuple(command), str(cwd)))
        return None

    monkeypatch.setattr(module.subprocess, "run", fake_run)

    module.build_artifacts(ROOT_DIR)

    assert calls == [
        (("npm", "run", "build"), str(ROOT_DIR / "frontend")),
        (("mvn", "clean", "package", "-DskipTests"), str(ROOT_DIR / "backend")),
    ]


def test_build_artifacts_stops_when_frontend_build_fails(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    module = load_module()
    calls: list[tuple[str, ...]] = []

    def fake_run(command, cwd, check):
        calls.append(tuple(command))
        if command[:3] == ["npm", "run", "build"]:
            raise module.subprocess.CalledProcessError(1, command)
        return None

    monkeypatch.setattr(module.subprocess, "run", fake_run)

    with pytest.raises(module.subprocess.CalledProcessError):
        module.build_artifacts(ROOT_DIR)

    assert calls == [("npm", "run", "build")]


def test_render_templates_writes_application_and_service_files(tmp_path: Path) -> None:
    module = load_module()
    env_dir = tmp_path / "deploy"
    env_file = env_dir / ".env.prod"
    write_env(env_file, base_env_text())
    config = module.load_config("prod", env_dir=env_dir)

    rendered = module.render_templates(config, output_dir=tmp_path / "rendered")

    app_text = rendered["application"].read_text(encoding="utf-8")
    service_text = rendered["service"].read_text(encoding="utf-8")
    assert "47.92.55.242:3306/allo" in app_text
    assert "allotcf_app" in app_text
    assert "db-secret" in app_text
    assert "abcdefghijklmnopqrstuvwxyz123456" in app_text
    assert "/opt/allotcf/backend" in service_text
    assert "/etc/allotcf/application-prod.yml" in service_text


def test_render_templates_creates_nginx_file(tmp_path: Path) -> None:
    module = load_module()
    env_dir = tmp_path / "deploy"
    env_file = env_dir / ".env.prod"
    write_env(env_file, base_env_text())
    config = module.load_config("prod", env_dir=env_dir)

    rendered = module.render_templates(config, output_dir=tmp_path / "rendered")

    nginx_text = rendered["nginx"].read_text(encoding="utf-8")
    assert "root /var/www/allotcf;" in nginx_text
    assert "proxy_pass http://localhost:8080;" in nginx_text
    assert "listen 443 ssl;" in nginx_text
    assert "ssl_certificate /etc/letsencrypt/live/47.94.88.161/fullchain.pem;" in nginx_text
    assert "return 308 https://$host$request_uri;" in nginx_text


def test_render_templates_can_disable_https(tmp_path: Path) -> None:
    module = load_module()
    env_dir = tmp_path / "deploy"
    env_file = env_dir / ".env.prod"
    write_env(
        env_file,
        base_env_text()
        .replace("ENABLE_HTTPS=true\n", "")
        .replace("TLS_CERT_PATH=/etc/letsencrypt/live/47.94.88.161/fullchain.pem\n", "")
        .replace("TLS_KEY_PATH=/etc/letsencrypt/live/47.94.88.161/privkey.pem\n", ""),
    )
    config = module.load_config("prod", env_dir=env_dir)

    rendered = module.render_templates(config, output_dir=tmp_path / "rendered")

    nginx_text = rendered["nginx"].read_text(encoding="utf-8")
    assert "listen 443 ssl;" not in nginx_text
    assert "return 308 https://$host$request_uri;" not in nginx_text


class FakeSFTP:
    def __init__(self) -> None:
        self.mkdir_calls: list[str] = []
        self.put_calls: list[tuple[str, str]] = []

    def mkdir(self, path: str) -> None:
        self.mkdir_calls.append(path)

    def put(self, local_path: str, remote_path: str) -> None:
        self.put_calls.append((local_path, remote_path))


class FakeSSHClient:
    def __init__(self, commands: list[tuple[str, int, str]] | None = None) -> None:
        self.connect_kwargs: dict[str, object] | None = None
        self.commands = commands or []
        self.exec_calls: list[str] = []
        self.sftp = FakeSFTP()

    def set_missing_host_key_policy(self, policy) -> None:
        return None

    def connect(self, **kwargs) -> None:
        self.connect_kwargs = kwargs

    def open_sftp(self) -> FakeSFTP:
        return self.sftp

    def exec_command(self, command: str):
        self.exec_calls.append(command)
        if self.commands:
            expected_command, exit_code, stderr_text = self.commands.pop(0)
            assert expected_command == command
        else:
            exit_code = 0
            stderr_text = ""
        stdout = types.SimpleNamespace(channel=types.SimpleNamespace(recv_exit_status=lambda: exit_code))
        stderr = io.BytesIO(stderr_text.encode("utf-8"))
        stdout.read = lambda: b""
        return None, stdout, stderr


def test_create_ssh_client_connects_with_env_credentials(monkeypatch: pytest.MonkeyPatch) -> None:
    module = load_module()
    fake_client = FakeSSHClient()
    monkeypatch.setattr(module.paramiko, "SSHClient", lambda: fake_client)
    monkeypatch.setattr(module.paramiko, "AutoAddPolicy", lambda: object())

    client = module.create_ssh_client(
        {
            "DEPLOY_HOST": "47.94.88.161",
            "DEPLOY_PORT": "22",
            "DEPLOY_USER": "root",
            "DEPLOY_PASSWORD": "secret",
        },
    )

    assert client is fake_client
    assert fake_client.connect_kwargs == {
        "hostname": "47.94.88.161",
        "port": 22,
        "username": "root",
        "password": "secret",
        "timeout": 15,
    }


def test_upload_deploy_bundle_creates_directories_and_uploads_files(tmp_path: Path) -> None:
    module = load_module()
    frontend_dist = tmp_path / "frontend" / "dist"
    frontend_dist.mkdir(parents=True)
    (frontend_dist / "index.html").write_text("<html></html>", encoding="utf-8")
    backend_target = tmp_path / "backend" / "target"
    backend_target.mkdir(parents=True)
    jar_path = backend_target / "allotcf.jar"
    jar_path.write_text("jar", encoding="utf-8")
    rendered_dir = tmp_path / "rendered"
    rendered_dir.mkdir()
    app_config = rendered_dir / "application-prod.yml"
    service_file = rendered_dir / "allotcf.service"
    nginx_file = rendered_dir / "allotcf.conf"
    for path in (app_config, service_file, nginx_file):
        path.write_text("content", encoding="utf-8")

    fake_sftp = FakeSFTP()
    module.upload_deploy_bundle(
        fake_sftp,
        {
            "REMOTE_FRONTEND_DIR": "/var/www/allotcf",
            "REMOTE_BACKEND_DIR": "/opt/allotcf/backend",
            "REMOTE_APP_CONFIG": "/etc/allotcf/application-prod.yml",
            "REMOTE_SYSTEMD_FILE": "/etc/systemd/system/allotcf.service",
            "REMOTE_NGINX_FILE": "/etc/nginx/conf.d/allotcf.conf",
        },
        frontend_dist=frontend_dist,
        backend_jar=jar_path,
        rendered_files={
            "application": app_config,
            "service": service_file,
            "nginx": nginx_file,
        },
    )

    assert fake_sftp.mkdir_calls == [
        "/var/www",
        "/var/www/allotcf",
        "/opt",
        "/opt/allotcf",
        "/opt/allotcf/backend",
        "/etc",
        "/etc/allotcf",
        "/etc/systemd",
        "/etc/systemd/system",
        "/etc/nginx",
        "/etc/nginx/conf.d",
    ]
    assert fake_sftp.put_calls == [
        (str(frontend_dist / "index.html"), "/var/www/allotcf/index.html"),
        (str(jar_path), "/opt/allotcf/backend/allotcf.jar"),
        (str(app_config), "/etc/allotcf/application-prod.yml"),
        (str(service_file), "/etc/systemd/system/allotcf.service"),
        (str(nginx_file), "/etc/nginx/conf.d/allotcf.conf"),
    ]


def test_run_remote_deploy_commands_in_order() -> None:
    module = load_module()
    fake_ssh = FakeSSHClient(
        commands=[
            ("chown -R root:root /opt/allotcf /var/www/allotcf /etc/allotcf", 0, ""),
            ("systemctl daemon-reload", 0, ""),
            ("systemctl restart allotcf", 0, ""),
            ("nginx -t", 0, ""),
            ("systemctl restart nginx", 0, ""),
        ],
    )

    module.run_remote_deploy(
        fake_ssh,
        {
            "REMOTE_BACKEND_DIR": "/opt/allotcf/backend",
            "REMOTE_FRONTEND_DIR": "/var/www/allotcf",
            "REMOTE_APP_CONFIG": "/etc/allotcf/application-prod.yml",
        },
    )

    assert fake_ssh.exec_calls == [
        "chown -R root:root /opt/allotcf /var/www/allotcf /etc/allotcf",
        "systemctl daemon-reload",
        "systemctl restart allotcf",
        "nginx -t",
        "systemctl restart nginx",
    ]


def test_run_remote_deploy_stops_when_nginx_check_fails() -> None:
    module = load_module()
    fake_ssh = FakeSSHClient(
        commands=[
            ("chown -R root:root /opt/allotcf /var/www/allotcf /etc/allotcf", 0, ""),
            ("systemctl daemon-reload", 0, ""),
            ("systemctl restart allotcf", 0, ""),
            ("nginx -t", 1, "nginx: configuration file test failed"),
        ],
    )

    with pytest.raises(RuntimeError) as exc_info:
        module.run_remote_deploy(
            fake_ssh,
            {
                "REMOTE_BACKEND_DIR": "/opt/allotcf/backend",
                "REMOTE_FRONTEND_DIR": "/var/www/allotcf",
                "REMOTE_APP_CONFIG": "/etc/allotcf/application-prod.yml",
            },
        )

    assert "nginx: configuration file test failed" in str(exc_info.value)
    assert fake_ssh.exec_calls == [
        "chown -R root:root /opt/allotcf /var/www/allotcf /etc/allotcf",
        "systemctl daemon-reload",
        "systemctl restart allotcf",
        "nginx -t",
    ]


def test_run_health_checks_uses_backend_and_public_urls() -> None:
    module = load_module()
    fake_ssh = FakeSSHClient(
        commands=[
            ("curl --silent http://127.0.0.1:8080", 0, ""),
            ("curl --silent http://127.0.0.1", 0, ""),
        ],
    )

    result = module.run_health_checks(
        fake_ssh,
        {
            "APP_PORT": "8080",
            "PUBLIC_BASE_URL": "http://47.94.88.161",
        },
    )

    assert fake_ssh.exec_calls == [
        "curl --silent http://127.0.0.1:8080",
        "curl --silent http://127.0.0.1",
    ]
    assert "部署成功" in result
    assert "http://47.94.88.161" in result


def test_run_health_checks_retries_until_backend_is_ready(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    module = load_module()
    fake_ssh = FakeSSHClient(
        commands=[
            ("curl --silent http://127.0.0.1:8080", 1, ""),
            ("curl --silent http://127.0.0.1:8080", 1, ""),
            ("curl --silent http://127.0.0.1:8080", 0, ""),
            ("curl --silent http://127.0.0.1", 0, ""),
        ],
    )
    sleep_calls: list[int] = []
    monkeypatch.setattr(module.time, "sleep", lambda seconds: sleep_calls.append(seconds))

    result = module.run_health_checks(
        fake_ssh,
        {
            "APP_PORT": "8080",
            "PUBLIC_BASE_URL": "http://47.94.88.161",
        },
    )

    assert fake_ssh.exec_calls == [
        "curl --silent http://127.0.0.1:8080",
        "curl --silent http://127.0.0.1:8080",
        "curl --silent http://127.0.0.1:8080",
        "curl --silent http://127.0.0.1",
    ]
    assert sleep_calls == [2, 2]
    assert "部署成功" in result
