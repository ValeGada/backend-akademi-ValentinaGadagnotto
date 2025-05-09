const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
    },
});

const sendConfirmationEmail = async ({ email, name, day, hour, doctor }) => {
    const mailOptions = {
        from: `"Clínica Vortex" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Confirmación de turno',
        text: 
            `Hola ${name}!
        Tu turno para la fecha ${day} a las ${hour} está confirmado.
        El profesional que te atenderá será ${doctor}.
        Para cancelar el turno o ante cualquier consulta, comunicate con nosotros.`
    };
  
    try {
        await transporter.sendMail(mailOptions);
    } catch (err) {
        console.error('Error al enviar el correo:', err);
        throw new Error('Could not send email.');
    }
};
  
module.exports = sendConfirmationEmail;