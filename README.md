# 仓库03 校园物品共享租赁系统

基于 Solidity、HTML/CSS/JavaScript、ethers.js 5.7.2 和 MetaMask 的链上校园物品租赁 DApp。包含租客、出租者和管理员三类页面，以及完整的合约源码和原项目文档。

## 在线使用

**网站：https://thv-television-hongkong.github.io/cangku03/**

1. 在电脑浏览器安装 MetaMask，或在手机 MetaMask 的内置浏览器中打开网站。
2. 在 MetaMask 中启用测试网络，选择 **Sepolia（Chain ID 11155111）**，准备少量测试 ETH 用于 Gas 与测试押金。
3. 打开网站，选择租客或出租者入口，点击“连接钱包”。如果当前网络不是 Sepolia，页面会请求切换，需在钱包中确认。
4. 出租者可以上架和管理自己的物品；租客可以查询物品 ID、租借、归还、评价。管理员页面仅接受合约部署钱包。
5. 所有写入操作都需要使用者在自己的 MetaMask 中签名。网页不会索取助记词或私钥。

本仓库按原项目保留钱包链上模式，没有浏览器模拟模式，也不提供中心化注册或登录服务。网页上线不代表每个访客自动具有管理员权限。

## 网络与合约

- 网络：Ethereum Sepolia 测试网，Chain ID `11155111`（`0xaa36a7`）。
- 当前前端合约地址：`0xd38eBdD2B09a66d7Ad84fF7596BbC5D7F693b9d0`。
- [在 Sepolia Etherscan 查看合约](https://sepolia.etherscan.io/address/0xd38eBdD2B09a66d7Ad84fF7596BbC5D7F693b9d0)。
- 网络与地址集中在 `assets/campus.js`，合约 ABI 另附于 `assets/GoodsRent.abi.json`。
- 发布准备期间已通过只读 RPC 确认该地址存在合约代码，`admin()`、`getGoodsCount()` 和 `getRentRecordCount()` 可调用。此检查没有发送链上交易。

金额输入沿用原项目的 **wei** 单位。`1 ETH = 10^18 wei`；不要把 wei 输入框当作 ETH 输入框。商品 ID 和记录 ID 均从 0 开始，当前内容以链上实际数据为准。

原项目自带的[安全审计报告](docs/安全审计报告.docx)指出合约存在已知资金结算与重入等风险。本次发布保留原合约业务逻辑，并未重新部署或修复链上合约；适合使用测试 ETH 进行教学实验，不应用于真实资金或主网。租期过长导致租金超过押金时，原合约可能拒绝归还，具体以原代码及审计报告为准。

## 功能

- **租客**：查询物品、支付押金租借、归还物品、归还后在前端提交评分。
- **出租者**：上架物品、切换自己物品的上架状态、查询物品与评价。
- **管理员**：查询物品、查询租赁记录、拉黑或解除拉黑钱包地址。

原出租者页的“提交拉黑申请”没有接收服务器，也没有对应链上接口。发布版将其改为说明联系管理员的方式，避免显示未实际发生的提交结果。

## 项目结构

```text
index.html               角色入口与使用提示
user.html                租客页面
seller.html              出租者页面
admin.html               管理员页面
GoodsRent.sol            原 Solidity 合约源码
assets/                  本地 ethers.js、许可证、钱包连接配置和 ABI
original/                原项目的 5 份代码 TXT，原样保留
docs/                    原需求规格、软件设计和安全审计 3 份文档
start.bat                Windows 本地网页服务
.nojekyll                GitHub Pages 静态文件配置
```

原文档中有部分地址、角色描述和功能说明与最终代码不完全一致，运行行为以本仓库网页、`GoodsRent.sol` 及实际部署合约为准。本地源码与现有链上字节码尚未做完整源码验证，不应仅因地址有代码就认定二者完全一致。

## 下载到本地

[下载完整 ZIP](https://github.com/thv-television-hongkong/cangku03/archive/refs/heads/main.zip)，或：

```bash
git clone https://github.com/thv-television-hongkong/cangku03.git
cd cangku03
python -m http.server 8000 --bind 127.0.0.1
```

打开 `http://127.0.0.1:8000`。Windows 安装 Python 后也可双击 `start.bat`。本地运行同样需要 MetaMask、Sepolia 和测试 ETH，无需数据库或后端服务。

## 发布说明

GitHub Pages 使用 `main` 分支根目录发布。前端已将原 TXT 页面恢复为 HTML，把 ethers.js 打包到本地，补充 Sepolia 网络与合约存在性检查、管理员钱包检查、钱包切换后的重新连接，并将日志改为纯文本渲染。

原首页中的固定密码只是可绕过的前端跳转条件，发布版改为直接进入管理员页，由合约管理员钱包确认权限；原始代码仍保存在 `original/`。Solidity 文件保持原样，未包含任何钱包私钥或助记词。

ethers.js 使用 MIT 许可证，全文见 `assets/ETHERS_LICENSE.md`。合约源码中的 SPDX 声明沿用原文件。
