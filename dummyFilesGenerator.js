const fs = require('fs');
const { exec } = require('node:child_process');

(async() =>{
    for(let i=0;i<10;i++){
        const fileName = `2023-${(i<10)? '0'+ i : i}-01.txt`
        exec(`type nul > ./disk/${fileName}`, (err, output) => {
            if (err) {
                console.error("could not execute command: ", err);
                return
            }
            // console.log("Output: \n", output);
        })
    }
   
})();
