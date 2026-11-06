# 오라클 대전 서버

공개 주소: https://radio.magamiscom.ing/mage/

- 앱: `/srv/apps/ordinary-mage/current` → `releases/` 안의 배포 폴더
- 실행 파일: `/srv/apps/ordinary-mage/runtime/node-v24.13.0-linux-arm64/bin/node`
- 서비스: `ordinary-mage.service`
- 내부 포트: `127.0.0.1:8787`
- HTTPS 경로: `/mage/`, WebSocket: `/mage/pvp`
- Nginx: 기존 HTTPS 서버 블록에서 `/etc/nginx/snippets/ordinary-mage.conf`만 추가로 읽습니다.
- 최초 Nginx 백업: `/etc/nginx/sites-available/workmusic-radio.before-mage-20261106T005539Z`

새 배포는 `dist/`, `server/`, `ops/`, `package.json`, `package-lock.json`을 새 `releases/` 폴더에 넣고 해당 Node의 PATH에서 `npm ci --omit=dev`를 실행합니다. `current` 링크를 새 폴더로 바꾼 뒤 **ordinary-mage 서비스만** 재시작합니다. 재시작은 진행 중인 경기를 종료하므로 `/mage/health`의 `rooms`가 0인지 먼저 확인하세요.

문제가 생기면 `current`를 이전 배포 폴더로 되돌리고 같은 서비스만 재시작합니다. 경로 설정을 바꾸는 경우 `nginx -t`가 통과한 뒤 reload합니다. 기존 오디오·뉴스·기기 제어 서비스는 재시작하지 않습니다.

상태 확인:

```sh
systemctl status ordinary-mage.service
journalctl -u ordinary-mage.service -n 50
curl -f http://127.0.0.1:8787/health
```

이 서비스는 로그인·개인정보 저장·전적 저장을 하지 않습니다. 방과 경기 상태는 메모리에만 있으며 프로세스를 다시 시작하면 사라집니다.
