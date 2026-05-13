package com.allotcf.exception;

public class GuestLimitReachedException extends RuntimeException {

    public GuestLimitReachedException() {
        super("访客预览次数已用完，注册或登录后可继续保存进度、复盘错题和收藏题目。");
    }
}
