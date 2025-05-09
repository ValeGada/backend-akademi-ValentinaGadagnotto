const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const sendRecoveryEmail = async ({ email, name, link }) => {

  const mailOptions = {
    from: `"Clínica Vortex" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: 'Recuperación de contraseña',
    text: 
      `Hola ${name}!
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
