"use strict";
window.CampusRental = (() => {
    const config = Object.freeze({
        chainId: 11155111,
        chainHex: "0xaa36a7",
        networkName: "Sepolia",
        address: "0xd38eBdD2B09a66d7Ad84fF7596BbC5D7F693b9d0"
    });
    let subscribed = false;
    async function connect(abi, requireAdmin = false) {
        if (!window.ethereum || !window.ethereum.isMetaMask) throw new Error("请先安装 MetaMask，或使用 MetaMask 的内置浏览器。");
        if (!window.ethers) throw new Error("钱包交互脚本未能加载，请刷新页面。");
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const chain = await window.ethereum.request({ method: "eth_chainId" });
        if (Number(chain) !== config.chainId) {
            await window.ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: config.chainHex }] });
            const switched = await window.ethereum.request({ method: "eth_chainId" });
            if (Number(switched) !== config.chainId) throw new Error("请在 MetaMask 中切换到 Sepolia 测试网。");
        }
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        if (network.chainId !== config.chainId) throw new Error("网络错误：请连接 Sepolia 测试网。");
        if ((await provider.getCode(config.address)) === "0x") throw new Error("当前网络中没有找到租赁合约，请核对网络和合约地址。");
        const signer = provider.getSigner();
        const currentAddress = await signer.getAddress();
        const contract = new ethers.Contract(config.address, abi, signer);
        await contract.getGoodsCount();
        if (requireAdmin) {
            const admin = await contract.admin();
            if (admin.toLowerCase() !== currentAddress.toLowerCase()) throw new Error("该钱包不是此合约的管理员，请连接合约部署钱包。");
        }
        if (!subscribed && typeof window.ethereum.on === "function") {
            window.ethereum.on("accountsChanged", () => window.location.reload());
            window.ethereum.on("chainChanged", () => window.location.reload());
            subscribed = true;
        }
        return { provider, signer, contract, currentAddress };
    }
    return Object.freeze({ config, connect });
})();
