const express = require('express');
const Router = express.Router();
const fs = require('fs');
const axios = require('axios');
const registry = require("../services/registry.json");
const loadBalancer = require('../util/loadBalancer');

Router.use(express.json())
Router.use(express.urlencoded({ extended: true }))

const apiCheck = (registrationInfo) => {
    for (let instance of registry.services[registrationInfo.apiName].instances) {
        if (instance.url == registrationInfo.url) {
            return true;
        }
    }
    return false;
}

Router.post('/enable/:apiName', (req,res) =>{
    const apiName = req.params.apiName;
    const instances = registry.services[apiName].instances;
    const index = (instances.findIndex(srv => {
        return srv.url == req.body.url;
    }));
    if(index == -1){
        res.json({status : 'error', message : 'Could not enable/disable ' + req.body.url + 'service for ' + apiName});
    }
    instances[index].enabled = req.body.enable;
    fs.writeFile('./services/registry.json', JSON.stringify(registry), (error) => {
        if (error) {
            res.json({status : 'error', message : 'Could not enable/disable ' + req.body.url + 'service for ' + apiName});
        } else {
            res.json({status : 'Success', message : 'Successfully enabled/disabled ' + req.body.url + 'service for ' + apiName});
        }
    });
});

Router.post('/register', (req, res) => {
    const registrationInfo = req.body;
    registrationInfo.url = registrationInfo.protocol + '://' + registrationInfo.host + ':' + registrationInfo.port + '/';
    console.log(registrationInfo);
    if (!registry.services[registrationInfo.apiName]) {
        registry.services[req.body.apiName] = { instances: [{ ...registrationInfo }], index: 0 };
    }
    else if (apiCheck(registrationInfo)) {
        res.send(`${registrationInfo.apiName} already exists in the configuration at ${registrationInfo.url}`);
    }
    else {
        registry.services[req.body.apiName].instances.push({ ...registrationInfo });
    }
    fs.writeFile('./services/registry.json', JSON.stringify(registry), (error) => {
        if (error) {
            console.log('Error occurred while writing to file' + error);
            res.send('Error occurred');
        } else {
            res.send('Successfully registered' + registrationInfo.apiName);
        }
    });
});

Router.post('/unregister', (req, res) => {
    const registrationInfo = req.body;
    registrationInfo.url = registrationInfo.protocol + '://' + registrationInfo.host + ':' + registrationInfo.port + '/';
    if (registry.services[registrationInfo.apiName] && apiCheck(registrationInfo)) {
        const deleteIndex = registry.services[registrationInfo.apiName].instances.findIndex(instance => {
            return instance.url == registrationInfo.url;
        });
        registry.services[registrationInfo.apiName].instances.splice(deleteIndex, 1);
    }
    else {
        res.send(`${registrationInfo.apiName} does not exist in the configuration at ${registrationInfo.url}`);
    }
    fs.writeFile('./services/registry.json', JSON.stringify(registry), (error) => {
        if (error) {
            console.log('Error occurred while writing to file' + error);
            res.send('Error occurred');
        } else {
            res.send('Successfully unregistered' + registrationInfo.apiName);
        }
    });
});

Router.all('/:apiName/:path', (req, res) => {
    const service = registry.services[req.params.apiName];
    // console.log(req.params.apiName);
    if (service) {
        if(!service.loadBalancingStrategy){
            service.loadBalancingStrategy = 'ROUND_ROBIN';
            fs.writeFile('./services/registry.json', JSON.stringify(registry), (error) => {
                if (error) {
                    console.log('Error occurred while creating load balancing strategy' + error);
                    res.send('Error occurred');
                }
            });

        }
        const newIndex = loadBalancer[service.loadBalancingStrategy](service);
        const loadBalancedUrl = service.instances[newIndex].url;
        console.log(loadBalancedUrl);
        axios({
            method: req.method,
            url: loadBalancedUrl + req.params.path,
            data: req.body
        }).then((response) => {
            // console.log(response);
            res.send(response.data);
        }).catch((error) => {
            // console.log(error);
            res.send("");
        })
    }
    else {
        res.send('Api Name not found');
    }
})

module.exports = Router;