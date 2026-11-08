일반마법사 커리큘럼 효과음

생성 도구
  /Users/bacbaqui/Desktop/code/02_tools/audio-studio-mcp
  Audio Studio 실행.command를 열면 생성 도구의 웹 화면이 열립니다.
  모델은 Hugging Face 캐시에 저장됩니다. 게임 실행에는 모델이 필요하지 않습니다.

다시 생성
  /Users/bacbaqui/Desktop/code/02_tools/audio-studio-mcp/.venv/bin/python scripts/audio/generate.py
  기존 outputs/audio-source/*-result.json이 있으면 후보를 다시 생성하지 않고 재사용합니다.
  프롬프트와 시드는 generate.py, 원본 후보와 생성 기록은 outputs/audio-source에 보관합니다.
  자동 선택은 시작 지연과 신호 크기를 기준으로 합니다. 사람의 청음 평가를 대체하지 않습니다.

게임 적용
  dist/audio/*.wav: 44.1kHz 모노, 피크 -3dB, 앞뒤 무음 정리와 짧은 페이드 적용.
  dist/audio/manifest.json: 파일별 길이, 용량, 프롬프트, 선택한 원본.
  dist/game-audio.mjs: 속성별 시전, 조합 레이어, 충전 반복, 명중, 구르기.
  첫 클릭이나 키 입력 뒤 소리가 켜집니다. 상단 소리 버튼의 설정은 브라우저에 저장됩니다.
  동시 재생 12개 제한, 연속 타격 간격 제한, 거리 감쇠, 좌우 배치, 출력 압축을 적용했습니다.
  충전음은 취소·일시정지·탭 숨김·창 이탈·재시작 때 멈춥니다.

확인
  node test-audio-browser.mjs
  node test-pvp-browser.mjs
  http://127.0.0.1:8873/sound-check.html 에서 효과음을 각각 들을 수 있습니다.

출처
  https://github.com/kanaworksai-hue/audio-studio-mcp
  https://github.com/Stability-AI/stable-audio-3
  모델 및 생성물 이용 조건: Stability AI Community License.
  도구의 MIT 라이선스와 모델 라이선스는 별개입니다.

2026-11-09 · 묵직한 판타지 효과음 2차
  generate-v2.py로 새 프롬프트·새 시드·후보 3개씩 생성합니다.
  outputs/audio-fantasy-v2/game의 완성 파일을 dist/audio에 반영합니다.
  원본과 후보 기록은 outputs/audio-fantasy-v2에 보관합니다.
  35Hz 아래와 극고음을 정리하고, 130Hz 저음을 보강했습니다.
  미리보기는 충전·시전·명중 이벤트를 연결하며, 화면 제출 직후 시전음을 시작합니다.
  node test-plan-audio-browser.mjs로 동기화와 재생 중단을 검사합니다.
  TEST_URL=https://radio.magamiscom.ing/mage/ 로 공개 페이지를 검사할 수 있습니다.

2026-11-09 · 선명도 수정 3차
  refine-v3.py: 10종을 질감 중심 프롬프트로 재생성하고, 독·밀기·명중·구르기는 기존 원본 후보를 재처리합니다.
  outputs/audio-clear-v3/game 파일을 dist/audio에 반영합니다.
  저음 보강을 제거하고 소리별로 85~250Hz 아래 및 220Hz 저음을 감쇠합니다.
  고음을 일괄 차단하지 않으며, 잔향은 시전음 기준 최대 0.55~1.3초로 정리합니다.
  충전음·명중음·조합 보조음의 재생 음량을 낮추고, 고단계 마법의 음높이 낮추기를 제거했습니다.
  comparison.json은 주파수·음량 검증이며 사람의 청음 평가를 대신하지 않습니다.
