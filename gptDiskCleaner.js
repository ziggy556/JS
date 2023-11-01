const fs = require('fs');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const dotenv = require('dotenv');

dotenv.config();

// Configure the directory path and threshold date
const directoryPath = './disk/';
const thresholdDate = new Date('2023-06-01');

// Schedule the cron job to run the script every day at 12:00 AM
cron.schedule('*/15 * * * * *', () => {
    // Scan the directory and delete files with date names before the threshold date
    fs.readdir(directoryPath, (err, files) => {
        if (err) {
            console.error('Error reading directory:', err);
            return;
        }

        const deletedFiles = [];

        files.forEach((file) => {
            const filePath = `${directoryPath}/${file}`;
            const fileStat = fs.statSync(filePath);

            if (fileStat.isFile()) {
                const fileName = file.split('.')[0];
                const fileDate = new Date(fileName);

                if (fileDate < thresholdDate && file.endsWith('.txt')) {
                    fs.unlinkSync(filePath);
                    deletedFiles.push(file);
                }
            }
        });

        // Send email with deleted file details
        sendEmail(deletedFiles);
    });
});

// Function to send email
function sendEmail(deletedFiles) {
    // Configure your email settings
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SEND_USER,
            pass: process.env.SEND_PASS
        },
    });

    // Email content
    const mailOptions = {
        from: process.env.SEND_USER,
        to: process.env.RECEIVE_USER,
        subject: 'Deleted Files using Disk Cleaner',
        text: `Number of files Deleted -> ${deletedFiles.length} \n Names of Files which got deleted ->${deletedFiles.join('\t')}
        Date and Time of Execution -> ${new Date()}`
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}
