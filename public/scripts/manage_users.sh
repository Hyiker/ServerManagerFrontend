#!/bin/bash

# 如果指定文件参数，则使用文件，否则从标准输入读取
if [[ $# -eq 1 ]]; then
    USERFILE="$1"
else
    USERFILE="/dev/stdin"
fi


# 检查用户是否存在
user_exists() {
    id "$1" &>/dev/null
}

# 添加用户到存在的组
add_user_to_existing_groups() {
    local username="$1"
    shift
    local groups=("$@")

    for group in "${groups[@]}"; do
        if getent group "$group" > /dev/null; then
            echo "   - 添加 $username 到组 $group"
            usermod -aG "$group" "$username"
        else
            echo "   - 组 $group 不存在，跳过"
        fi
    done
}

# 管理员应加入的组
ADMIN_GROUPS=(sudo docker lxd incus-admin)

# 处理每一行
while IFS=: read -r role username; do
    [[ -z "$role" || -z "$username" ]] && continue

    echo "处理用户: $username ($role)"

    if user_exists "$username"; then
        echo " - 用户已存在，跳过创建"
        if [[ "$role" == "admin" ]]; then
            echo " - 添加组: sudo docker lxd incus-admin"
            add_user_to_existing_groups "$username" "${ADMIN_GROUPS[@]}"
        elif [[ "$role" == "user" ]]; then
            echo " - 删除 sudo 权限"
            gpasswd -d "$username" sudo
            gpasswd -d "$username" admin
            gpasswd -d "$username" wheel

            echo " - 禁止登录"
            usermod -s /usr/sbin/nologin "$username"
        else
            echo " - 未知角色: $role，跳过"
        fi
    else
        if [[ "$role" == "admin" ]]; then
            echo " - 创建管理员用户 $username"
            adduser --disabled-password --gecos "" "$username"

            echo " - 添加组: sudo docker lxd incus-admin"
            add_user_to_existing_groups "$username" "${ADMIN_GROUPS[@]}"
        elif [[ "$role" == "user" ]]; then
            echo " - 创建普通用户 $username（无home，不可登录）"
            adduser --disabled-password --gecos "" --shell /usr/sbin/nologin --no-create-home "$username"
        else
            echo " - 未知角色: $role，跳过"
        fi
    fi

    echo ""
done < "$USERFILE"
