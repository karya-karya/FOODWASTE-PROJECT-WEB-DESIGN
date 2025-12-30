const scan = {
  _scanner: null,

  setStatus(msg) {
    document.getElementById('scan-status').innerText = "Status: " + msg;
  },

  async verify(qr) {
    if (!qr) return;

    this.setStatus("Verifying...");
    const r = await fetch('api/reservations.php?action=verify_qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qr })
    });
    const res = await r.json();

    if (res.status === 'success') {
      this.setStatus("✅ Delivery confirmed!");
    } else {
      this.setStatus("❌ " + (res.message || "Verification failed"));
    }
  },

  async verifyPaste() {
    const qr = document.getElementById('qrInput').value.trim();
    if (!qr) return alert("Paste a QR value first.");
    await this.verify(qr);
  },

  async start() {
    if (typeof Html5Qrcode === "undefined") {
      alert("Scanner library not loaded.");
      return;
    }

    const readerId = "qr-reader";
    document.getElementById(readerId).innerHTML = "";

    if (!this._scanner) {
      this._scanner = new Html5Qrcode(readerId);
    }

    try {
      const cameras = await Html5Qrcode.getCameras();
      if (!cameras || cameras.length === 0) {
        alert("No camera found.");
        return;
      }

      const backCam = cameras.find(c => /back|rear|environment/i.test(c.label));
      const cameraId = (backCam || cameras[0]).id;

      await this._scanner.start(
        cameraId,
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          await this.verify(decodedText);
          await this.stop();
        },
        () => {}
      );

      this.setStatus("Camera started. Point at QR...");
    } catch (e) {
      this.setStatus("Camera failed. Allow permission.");
      alert("Scanner failed to start:\n" + e);
    }
  },

  async stop() {
    if (!this._scanner) return;
    try {
      await this._scanner.stop();
      await this._scanner.clear();
      this.setStatus("Stopped.");
    } catch (_) {}
  }
};
