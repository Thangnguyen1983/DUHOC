# Ghi chú an toàn: careful / freeze / guard / unfreeze (và bin/)

Nguồn: careful/SKILL.md, freeze/SKILL.md, guard/SKILL.md, unfreeze/SKILL.md, careful/bin/*.sh, freeze/bin/*.sh, bin/gstack-settings-hook, bin/gstack-verify-gate, bin/gstack-redact-prepush.

## 1. Cơ chế thực thi: HOOK, không phải lời nhắc trong prompt

Cả bốn skill dùng hook PreToolUse của Claude Code, khai báo ngay trong frontmatter SKILL.md (`hooks.PreToolUse[].matcher` + `type: command`). Hook chạy như tiến trình ngoài, đọc JSON `tool_input` từ stdin, trả JSON `hookSpecificOutput.permissionDecision` (`ask` | `deny`) hoặc `{}` (cho qua). Quyết định PHẢI lồng dưới `hookSpecificOutput`; Claude Code bỏ qua `permissionDecision` ở cấp cao nhất.

| Skill | Hook đăng ký | Script | Quyết định |
|---|---|---|---|
| careful | Bash, PowerShell | careful/bin/check-careful.sh | ask (MEDIUM), deny (HIGH) |
| freeze | Edit, Write, NotebookEdit | freeze/bin/check-freeze.sh | deny nếu ngoài ranh giới |
| guard | cả hai nhóm trên | dùng lại 2 script ở careful/ và freeze/ (guard không có bin/ riêng; phụ thuộc careful + freeze được cài cùng) | như trên |
| unfreeze | không có hook | freeze/bin/freeze-state.sh clear | xóa tệp trạng thái |

Phạm vi sống:
- careful: hook theo PHIÊN. Hết hội thoại là hết hiệu lực. Không có tệp trạng thái.
- freeze: ranh giới BỀN trong `$GSTACK_STATE_ROOT/freeze-dir.txt` (dòng 1 = thư mục tuyệt đối, dòng 2 = `gstack-freeze-v1:<owner 32 hex>`). Kết thúc phiên không xóa; chỉ /unfreeze. Hook còn đăng ký sau /unfreeze nhưng cho qua vì không có tệp.
- Resolve state root phải giống giữa người ghi (gstack-paths) và hook đọc (`gstack_hook_state_root` trong hook-extract.sh); từng có lỗi fail-open do lệch (#1459, #1509).

## 2. Danh sách lệnh nguy hiểm (check-careful.sh)

Kiểm theo THỨ TỰ TẦNG (khớp đầu tiên thắng):

0. Phân tích payload: dùng parser JSON thật (hook-extract.sh), KHÔNG dùng grep (grep cũ cắt tại dấu nháy escape nên `git commit -m "x" && rm -rf /` lọt). Không parse được payload -> `ask` (fail-ask). Không có trường command -> cho qua. Thiếu helper -> `ask`.
1. Tripwire ngụy trang shell -> ask: `${IFS}`, `$IFS`, `$(echo ... base64 ...)`, `base64 -d | sh/bash`.
2. HIGH (deny cứng, chỉ với lệnh ĐƠN GIẢN: không có `; && || |` hay xuống dòng):
   - `rm` đệ quy mà MỌI mục tiêu đều là `/`, `~`, `~/`, `$HOME`, `${HOME}`, `/*`, `//` (bỏ qua cờ, bỏ nháy, bỏ chuyển hướng như `2>/dev/null`). Có mục tiêu khác thì không HIGH.
   - `git push` có `-f`/`--force` HOẶC refspec `+ref` nhắm đúng nhánh mặc định (origin/HEAD, rơi về origin/main rồi origin/master); `git push --force` trần chỉ HIGH khi đang đứng trên nhánh mặc định. `--force-with-lease` KHÔNG BAO GIỜ là HIGH.
3. Ngoại lệ an toàn (cho qua `{}`): một lệnh `rm -r[f]` duy nhất chỉ nhắm `node_modules|.next|dist|__pycache__|.cache|build|.turbo|coverage` (chấp nhận `-R`; loại mục tiêu có `(`/backtick/`;&|#`; lệnh nhiều dòng không được hưởng ngoại lệ).
4. MEDIUM (ask, luôn ghi đè được):
   - Windows/PowerShell (chỉ khi tool là PowerShell hoặc lệnh có `powershell|pwsh|cmd` lồng nhau): Remove-Item/rm/ri/del/erase/rd/rmdir có -Recurse/-Force (nhận tiền tố tham số), `rd /s`, `del /s`, Format-Volume, Clear-Disk, Clear-Content/clc, `[IO.Directory]::Delete`/`[IO.File]::Delete`, `powershell -EncodedCommand`, Invoke-Expression/iex, Start-Process mở shell, toán tử gọi `& $cmd`. Bỏ `^` và backtick trước khi so khớp. Nhận xét: best-effort; ưu tiên deny rule của Claude Code `PowerShell(Remove-Item *)`.
   - `rm -r`/`-R`/`--recursive`
   - `DROP TABLE`/`DROP DATABASE` (không phân biệt hoa thường)
   - `TRUNCATE`
   - `git push -f/--force/+ref`
   - `git reset --hard`
   - `git checkout .` / `git restore .`
   - `kubectl delete`
   - `docker rm -f` / `docker system prune`
5. Mẫu dự án (CHỈ THÊM): `~/.gstack/careful-patterns.txt` và `~/.gstack/projects/<slug>/careful-patterns.txt`, mỗi dòng một regex ERE, `#` là chú thích, regex sai bị bỏ qua. Chỉ xét sau mẫu gốc nên không thể nới lỏng baseline.

Log: mỗi lần kích hoạt ghi `hook_fire` với TÊN mẫu (vd. high_rm_root, git_force_push), không ghi nội dung lệnh.

Giới hạn tự thừa nhận: so khớp chuỗi, KHÔNG phải ranh giới bảo mật; lệnh dựng lúc chạy có thể lọt; HIGH là "advisory hard-stop"; `curl | sh` cố ý KHÔNG bị chặn.

## 3. Cơ chế freeze (check-freeze.sh + freeze-state.sh)

- Polarity FAIL-CLOSED (tầng deny): payload không parse được -> deny; thiếu/cũ helper -> deny; hook chết bất ngờ -> trap EXIT in deny ("Hook failed unexpectedly"). Payload parse được nhưng không có `file_path`/`notebook_path` (tool không phải tệp) -> cho qua. Không có tệp trạng thái -> cho qua.
- Trích đường dẫn: `file_path` (Edit/Write) hoặc `notebook_path` (NotebookEdit) bằng parser JSON dùng chung.
- Chuẩn hóa: đường dẫn Windows/Git Bash/Cygwin về một dạng, rút `//`, bỏ `/` cuối, giữ `//` UNC, đường dẫn tương đối nối với cwd.
- Resolve symlink đến THÀNH PHẦN CUỐI (tối đa 40 bước) để symlink nằm trong ranh giới trỏ ra ngoài vẫn bị kiểm theo đích; so sánh theo tiền tố `"$FREEZE_DIR/"` (dấu `/` cuối ngăn `/src` khớp `/src-old`); Windows so sánh không phân biệt hoa thường.
- Ranh giới tương đối kiểu cũ -> deny (mơ hồ), buộc /freeze lại với đường dẫn tuyệt đối.
- freeze-state.sh (acquire|set|release|clear): khóa mutex bằng `mkdir .freeze-mutation.lock` (bận -> `FREEZE_BUSY`, không đổi gì); ghi tệp tạm + `mv` nguyên tử; owner token 32 hex từ /dev/urandom; `release OWNER` chỉ xóa khi owner khớp (dùng cho điều tra tự động nhờ cơ chế "acquire" không đè ranh giới người dùng: trả `FREEZE_PRESERVED`); `clear` là xóa do người dùng yêu cầu.
- Phạm vi: chỉ Edit/Write/NotebookEdit. Bash/PowerShell/Read/Glob/Grep KHÔNG bị hạn chế, nên `sed`, `Set-Content`... vẫn sửa được ngoài ranh giới (tài liệu nói rõ "ngăn nhầm, không phải bảo mật").

## 4. Hook/guard khác trong bin/ liên quan đến cổng chặn

- bin/gstack-settings-hook: quản lý hook trong ~/.claude/settings.json theo bảng KNOWN_HOOKS (question-log, question-preference, auq-error-fallback, timeline-stop, memorable-user-prompt, verify-gate...); hỗ trợ add-event/ensure-event/remove-source/prune-stale/rollback.
- bin/gstack-hook-check: kiểm cú pháp mọi hook gstack.
- bin/gstack-verify-gate: hook Stop; chặn kết thúc lượt cho đến khi lệnh xác minh khai báo trong CLAUDE.md (`<!-- gstack:verify: bun test -->`) qua. Không bao giờ chạy lệnh chưa được `--trust` (băm sha256 lệnh theo realpath repo, lưu 0600); thiếu khai báo thì fail-open. Exit 2 = chặn.
- bin/gstack-redact-prepush: hook git pre-push quét credential mức HIGH trong diff đang push; chỉ là rào chắn (`--no-verify` hoặc `GSTACK_REDACT_PREPUSH=skip` bỏ qua được). /ship Bước 17 hỏi cài một lần.
- bin/gstack-ci-gate (lib/ci-gate.ts): VERDICT PASS|FAIL|PENDING|NO_CHECKS|ERROR; exit 0/1/2/3/4 nhưng skill chỉ hành động theo dòng `VERDICT`; head phải khớp `--expect-head`, head di chuyển = ERROR; loại check chỉ khi `required=n` và có `--override-head`.
- bin/gstack-evidence: sổ bằng chứng (run/check, nhãn lane, cmd_sha256, tuổi tối đa, `--allow-paths` chỉ cho metadata phát hành) - "IRON LAW" của /ship Bước 16.
- bin/gstack-wtree: băm cây nội dung working tree (kể cả tệp chưa theo dõi) để buộc review với đúng nội dung.
- bin/gstack-review-log/--start/--finish và gstack-review-read: token bắt đầu + độ mới (review_freshness CURRENT/STALE/UNVERIFIED).
- bin/gstack-issue-guard: bọc nội dung PR/issue vào "trust envelope" (dữ liệu không tin cậy); gstack-safe-git: truy vấn git chỉ đọc theo allowlist.

## 5. Gợi ý khi chuyển sang hệ thống của DUHOC
- Hook của gstack nằm ở tầng harness (tiến trình ngoài), nên một "skill" trong ứng dụng khác KHÔNG tự có lực chặn tương đương; cần cơ chế thực thi phía máy chủ (giống quy tắc AGENTS.md: kiểm quyền dữ liệu ở máy chủ, ẩn menu không thay thế kiểm quyền).
- Nếu chỉ mô phỏng bằng prompt, ghi rõ đó là khuyến nghị; lực chặn thật phải là hook/permission rules.
