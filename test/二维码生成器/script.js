function generateQRCode() {
    var text = document.getElementById('text').value;
    if (text === '') {
      alert('请输入一些文本进行编码。');
      return;
    }
  
    var qr = qrcode(0, 'L');
    qr.addData(text);
    qr.make();
    document.getElementById('qrCanvas').innerHTML = '<img src="' + qr.createImgTag() + '">';
  }