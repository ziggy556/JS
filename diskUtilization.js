const fs = require('fs');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

const dirLoc = './disk/';
let thresholdDate = new Date('2023-06-04');

// Performs the delete operation for the log files before the configured date value
const diskCleaner = async () => {
    try {
        let deletedFileNames = [];
        const files = fs.readdirSync(dirLoc);
        for (let file of files) {
            const fileDate = new Date(String(file).substring(0, String(file).length - 4));
            // console.log(fileDate);
            if (fileDate < thresholdDate) {
                fs.unlinkSync(dirLoc + file);
                deletedFileNames.push(file);
            }
        }
        return new Promise(r => r(deletedFileNames));
    } catch (err) {
        console.log(`Error received while reading contents of directory -> ${dirLoc} -->${err}`);
        return new Promise(r => r("FAIL"));
    }
}

// Mails the delete summary for the configured users
const mailer = async (deletedFiles) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SEND_USER,
            pass: process.env.SEND_PASS
        }
    });

    let mailOptions = {
        from: process.env.SEND_USER,
        to: process.env.RECEIVE_USER,
        subject: 'Deleted Files using Disk Cleaner',
        text: `Number of files Deleted -> ${deletedFiles.length} \n Names of Files which got deleted ->${deletedFiles.join('\t')}
        Date and Time of Execution -> ${new Date()}`
    };

    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                reject(error);
            } else {
                console.log('Email sent: ' + info.response);
                resolve(info.response);
            }
        });
    })
}

// Entry point Self invoking function
(async () => {
    const start = new Date().getTime();
    const deletedFiles = await diskCleaner();
    console.log('Files deleted from the disk Cleaner ->', deletedFiles.join('\t'));
    await mailer(deletedFiles);
    const end = new Date().getTime();
    console.log('Execution time for the Disk Cleaner Script in milliseconds-->', end-start);
})();

// CRON job to perfrom the delete operation after 23 hours
cron.schedule("0 0 23 * * *", async () => {
    thresholdDate.setDate(thresholdDate.getDate()+1);
    const deletedFiles = await diskCleaner();
    console.log('Files deleted from the disk Cleaner ->', deletedFiles.join('\t'));
    await mailer(deletedFiles);
});