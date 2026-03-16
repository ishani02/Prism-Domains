const { ethers } = require("hardhat");

const main = async() => {
    const accounts = await hre.ethers.getSigners();
    const owner = accounts[0];
    const getDomains = await hre.ethers.getContractFactory("Domains");
    const domains = await getDomains.deploy("prism");
    console.log("contract address", domains.address);

    //await domains.connect(accounts[1]).register("ishani",{value: 1000000000000000});
    
    let txn = await domains.register("skskk", {value: hre.ethers.utils.parseEther('0.3')});
    await txn.wait();
    //  let txn1 = await domains.register("sksab", {value: hre.ethers.utils.parseEther('0.3')});
    // //txn1 = await domains.connect(accounts[1]).attachDataToDomain("skskk", "Hello hello");
    // await txn1.wait();
    // let balance = await hre.ethers.provider.getBalance(domains.address);
    // console.log("contract balance:",hre.ethers.utils.formatEther(balance));
    // await domains.getAllNames();
    
    // try {
    //    txn = await domains.connect(accounts[1]).withdraw();
    //    await txn.wait();
    // } catch (error) {
    //    console.log(error);
    // }
}

main()
.then(() => process.exit(0))
.catch((error) => {
    console.log(error);
    process.exit(1);
});

