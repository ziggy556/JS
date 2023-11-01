const loadBalancer = {}

loadBalancer.ROUND_ROBIN = (service) =>{
    let newIndex = (++service.index >= service.instances.length) ? 0 : service.index;
    service.index = newIndex;
    return loadBalancer.ENABLED_CHECKER(service, newIndex);
}

loadBalancer.ENABLED_CHECKER = (service, index) => {
    return (service.instances[index].enabled)? index : loadBalancer[service.loadBalancingStrategy](service);
}

module.exports = loadBalancer;