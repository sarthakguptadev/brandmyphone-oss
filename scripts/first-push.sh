#!/usr/bin/env bash
# Kept as an alias for existing users. The launcher supersedes the old push-only
# script by collecting configuration and creating GitHub secrets before push.
exec "$(cd "$(dirname "$0")" && pwd)/launch.sh" "$@"
