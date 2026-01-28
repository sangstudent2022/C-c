# Cờ Tướng (Chinese Chess / Xiangqi) Command

## Mô tả
Lệnh chơi Cờ Tướng (Xiangqi) - cờ tướng Trung Quốc với đầy đủ luật chơi chính xác.

## Cách sử dụng

### Bắt đầu game
```
cotuong
```

### Menu chính
1. **Tạo ván mới** - Tạo trò chơi 2 người
2. **Hướng dẫn** - Xem hướng dẫn chi tiết
3. **Tiếp tục** - Chơi tiếp ván đang dở

### Cách di chuyển
Format: `hàng_cột-hàng_cột`

Ví dụ:
- `90-80` - Di chuyển quân từ vị trí (9,0) đến (8,0)
- `91-73` - Di chuyển Mã từ (9,1) đến (7,3)
- `60-50` - Di chuyển Tốt từ (6,0) đến (5,0)

### Tọa độ bàn cờ
- Hàng: 0-9 (từ trên xuống dưới)
- Cột: 0-8 (từ trái sang phải)

```
Đen (trên)
  0 1 2 3 4 5 6 7 8
0 r h e a k a e h r
1 . . . . . . . . .
2 . c . . . . . c .
3 p . p . p . p . p
4 . . . . . . . . .
5 . . . . . . . . .
6 P . P . P . P . P
7 . C . . . . . C .
8 . . . . . . . . .
9 R H E A K A E H R
Đỏ (dưới)
```

## Quân cờ

| Ký hiệu | Tên (Đỏ) | Tên (Đen) | Ký tự |
|---------|----------|----------|-------|
| K/k | Tướng | Tướng | 帥/將 |
| A/a | Sĩ | Sĩ | 仕/士 |
| E/e | Tượng | Tượng | 相/象 |
| H/h | Mã | Mã | 傌/馬 |
| R/r | Xe | Xe | 俥/車 |
| C/c | Pháo | Pháo | 炮/砲 |
| P/p | Tốt | Tốt | 兵/卒 |

## Luật chơi

### Tướng (King)
- Di chuyển 1 ô theo chiều ngang hoặc dọc
- Chỉ được ở trong cung (3x3)
- Không được đối diện với Tướng địch

### Sĩ (Advisor)
- Di chuyển 1 ô theo đường chéo
- Chỉ được ở trong cung (3x3)

### Tượng (Elephant)
- Di chuyển 2 ô theo đường chéo
- Không được qua sông
- Có thể bị chặn ở ô giữa

### Mã (Horse)
- Di chuyển chữ "L" (2-1 hoặc 1-2)
- Có thể bị "cản chân"

### Xe (Rook)
- Di chuyển không giới hạn theo chiều ngang hoặc dọc
- Không được nhảy qua quân khác

### Pháo (Cannon)
- Di chuyển giống Xe
- Bắt quân phải nhảy qua 1 quân khác

### Tốt (Pawn)
- Trước khi qua sông: chỉ đi thẳng
- Sau khi qua sông: đi thẳng hoặc ngang

## Tính năng

- ✅ Đầy đủ luật Cờ Tướng
- ✅ Hiển thị bàn cờ trực quan
- ✅ Kiểm tra nước đi hợp lệ
- ✅ Phát hiện chiếu tướng
- ✅ Lưu trạng thái game
- ✅ 2 người chơi luân phiên

## Ví dụ trò chơi

```
Người chơi 1: cotuong
Bot: [Menu]
Người chơi 1: 1
Bot: Tag người chơi thứ 2
Người chơi 1: @NguoiChoi2
Bot: [Hiển thị bàn cờ] Lượt: Người chơi 1 (Đỏ)
Người chơi 1: 91-73
Bot: [Bàn cờ sau nước đi] Lượt: Người chơi 2 (Đen)
Người chơi 2: 01-23
...
```

## Lưu ý
- Mỗi thread chỉ có thể chơi 1 ván cùng lúc
- Ván đấu tự động lưu và có thể tiếp tục sau
- File game sẽ tự động xóa khi kết thúc
