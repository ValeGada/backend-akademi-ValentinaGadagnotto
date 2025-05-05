// const fs = require('fs');
// const path = require('path');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const sendRecoveryEmail = async ({ email, name, link }) => {
  // const templatePath = path.join(__dirname, 'templates', 'recoveryPassword.html');
  
  // // Leer el HTML como string
  // let html = fs.readFileSync(templatePath, 'utf-8');

  // // Reemplazar los valores dinámicos
  // html = html.replace('{{name}}', name).replace('{{link}}', link);

  const mailOptions = {
    from: `"Clínica Vortex" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Recuperación de contraseña',
    // html
    text: `Hola ${name}! 
    Se te ha enviado este link ${link} para que puedas recuperar tu contraseña. 
    Este enlace caduca en 1h.`
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Error al enviar el correo:', err);
    throw new Error('Could not send email.');
  }
};

module.exports = sendRecoveryEmail;
