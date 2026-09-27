"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateCardCode = generateCardCode;
exports.getDeviceInstructions = getDeviceInstructions;
exports.formatReviewCopyEmail = formatReviewCopyEmail;

function generateCardCode(prefix) {
  if (prefix === void 0) { prefix = "READ"; }
  var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  var p1 = "", p2 = "";
  for (var i = 0; i < 4; i++) {
    p1 += chars.charAt(Math.floor(Math.random() * chars.length));
    p2 += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return "".concat(prefix, "-").concat(p1, "-").concat(p2);
}

function getDeviceInstructions(format) {
  var f = format.toLowerCase();
  if (f === 'epub') {
    return {
      appleBooks: "Open Safari on your iPhone, iPad, or Mac, tap Download, then select 'Open in Apple Books'.",
      kobo: "Connect your Kobo eReader via USB cable to your computer and drag the EPUB file into the root directory.",
      android: "Open with Google Play Books or ReadEra from the Google Play Store."
    };
  }
  if (f === 'mobi' || f === 'azw3') {
    return {
      kindleEmail: "Email this file as an attachment to your '@kindle.com' personal document address.",
      sendToKindle: "Use Amazon's official web tool at amazon.com/sendtokindle to sync instantly to your Kindle devices.",
      usb: "Connect Kindle via USB cable and drag file into the 'documents' folder."
    };
  }
  return {
    general: "Open with any standard PDF viewer such as Adobe Acrobat, Apple Books, or your web browser."
  };
}

function formatReviewCopyEmail(params) {
  return {
    subject: "Your complimentary copy of \"".concat(params.bookTitle, "\" is ready"),
    html: "\n      <div style=\"font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b;\">\n        <h2 style=\"color: #0f172a; font-size: 22px;\">Hi ".concat(params.recipientName, ",</h2>\n        <p style=\"font-size: 15px; line-height: 1.6;\">You have received a complimentary digital review copy of <strong>").concat(params.bookTitle, "</strong>.</p>\n        ").concat(params.personalMessage ? "<blockquote style=\"border-left: 4px solid #0284c7; padding-left: 16px; margin: 20px 0; color: #475569; font-style: italic;\">\"".concat(params.personalMessage, "\"</blockquote>") : '', "\n        <div style=\"margin: 32px 0;\">\n          <a href=\"").concat(params.downloadUrl, "\" style=\"background-color: #0284c7; color: white; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: bold; font-size: 14px; display: inline-block;\">\n            Download Your E-book &rarr;\n          </a>\n        </div>\n        <p style=\"font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px;\">\n          Available in EPUB, Kindle, and PDF formats with device instructions.\n        </p>\n      </div>\n    ")
  };
}
