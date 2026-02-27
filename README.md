# Github streak

Tiện ích nhỏ để tùy biến/hiển thị nội dung liên quan đến GitHub streak thông qua `content.js` và cấu hình trong `manifest.json`.

## Cấu trúc hiện tại

- `manifest.json`: Cấu hình extension (Chrome/Chromium).
- `content.js`: Script chạy trên trang đích.

## Cách dùng nhanh

1. Mở `chrome://extensions/`.
2. Bật **Developer mode**.
3. Chọn **Load unpacked**.
4. Trỏ đến thư mục dự án này (`github-streak`).

## Chỉnh sửa

- Sửa logic trong `content.js`.
- Sửa **Username** và **Github Token** để sử dụng
- Cập nhật quyền hoặc metadata trong `manifest.json` nếu cần.
- Reload extension trong trang `chrome://extensions/` sau khi thay đổi.

## Gợi ý

- Nếu cần, có thể thêm phần `Version history` và `Roadmap` vào README để theo dõi tiến độ.
