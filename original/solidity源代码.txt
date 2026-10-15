// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;
contract GoodsRent {
    // 部署者=合约管理员
    address public immutable admin;

    // 商品结构体
    struct Good {
        string name;       // 商品名称
        uint256 pledge;    // 押金
        uint256 dayRent;   // 日租金
        bool enabled;      // 是否上架
        bool isRented;     // true=已出租不可再租
        address currentRenter; // 当前租客
        address owner;     // 发布人（出租者）
    }

    // 租赁记录
    struct RentRecord {
        uint256 goodId;
        address renter;
        uint256 startTime;
        bool finished;
    }

    // 评价
    struct Review {
        address user;
        uint8 score; //1~5星
    }

    // 黑名单
    mapping(address => bool) public blackList;
    Good[] public goods;
    RentRecord[] public rentRecords;
    mapping(uint256 => Review[]) public goodReviews;

    constructor() {
        admin = msg.sender;
    }

    // 管理员修饰器：仅合约管理员可调用
    modifier onlyAdmin() {
        require(msg.sender == admin, "only admin");
        _;
    }

    // 出租者修饰器：仅商品拥有者可操作该商品
    modifier onlyGoodOwner(uint256 goodId) {
        require(goodId < goods.length, "good not exist");
        require(goods[goodId].owner == msg.sender, "only goods owner");
        _;
    }

    // ===================== 核心改造：上架商品 =====================
    // 禁止管理员上架商品，普通用户(出租者)可上架
    function addGood(string calldata _name, uint256 _pledge, uint256 _dayRent) external {
        // 管理员禁止成为出租者
        require(msg.sender != admin, "admin cannot be seller");
        goods.push(Good({
            name: _name,
            pledge: _pledge,
            dayRent: _dayRent,
            enabled: true,
            isRented: false,
            currentRenter: address(0),
            owner: msg.sender
        }));
    }

    // ===================== 改造：商品上下架（仅商品出租者可操作） =====================
    function setGoodsEnable(uint256 goodId, bool _enable) external onlyGoodOwner(goodId) {
        goods[goodId].enabled = _enable;
    }

    // ===================== 拉黑/解除拉黑（仅管理员可操作） =====================
    function setBlack(address user, bool isBlack) external onlyAdmin {
        blackList[user] = isBlack;
    }

    // ===================== 租借逻辑（原有逻辑不变） =====================
    function rentGood(uint256 goodId) external payable {
        require(!blackList[msg.sender], "in blacklist");
        require(goodId < goods.length, "good not found");
        Good storage g = goods[goodId];
        require(g.enabled, "goods off shelf");
        require(g.owner != msg.sender, "cannot rent your own goods");
        require(!g.isRented, "goods already rented");
        require(msg.value == g.pledge, "pledge amount error");

        g.isRented = true;
        g.currentRenter = msg.sender;
        rentRecords.push(RentRecord({
            goodId: goodId,
            renter: msg.sender,
            startTime: block.timestamp,
            finished: false
        }));
    }

    // ===================== 归还商品（原有逻辑不变） =====================
    function returnGood(uint256 goodId) external {
        Good storage g = goods[goodId];
        require(g.isRented, "goods not rented");
        require(g.currentRenter == msg.sender, "not current renter");

        uint256 rentIndex;
        bool found = false;
        for (uint256 i = 0; i < rentRecords.length; i++) {
            if (rentRecords[i].goodId == goodId && 
                rentRecords[i].renter == msg.sender && 
                !rentRecords[i].finished) {
                rentIndex = i;
                found = true;
                break;
            }
        }
        require(found, "rent record not found");

        uint256 rentDay = (block.timestamp - rentRecords[rentIndex].startTime) / 86400;
        if(rentDay == 0) rentDay = 1;
        uint256 totalRent = rentDay * g.dayRent;
        require(totalRent <= g.pledge, "rent exceeds pledge");
        uint256 backPledge = g.pledge - totalRent;

        if(backPledge > 0){
            (bool ok, ) = payable(msg.sender).call{value: backPledge}("");
            require(ok,"refund fail");
        }
        (bool ok2, ) = payable(g.owner).call{value: totalRent}("");
        require(ok2,"pay rent fail");

        g.isRented = false;
        g.currentRenter = address(0);
        rentRecords[rentIndex].finished = true;
    }

    // ===================== 评价（原有逻辑不变） =====================
    function reviewGood(uint256 goodId, uint8 score) external {
        require(score >=1 && score <=5, "score 1~5");
        goodReviews[goodId].push(Review({user:msg.sender,score:score}));
    }

    // ===================== 查询接口（增强，满足后台查询需求） =====================
    // 获取单条商品详情
    function getGoodInfo(uint256 goodId) external view returns(
        string memory name,
        uint256 pledge,
        uint256 dayRent,
        bool enabled,
        bool isRented,
        address currentRenter,
        address owner
    ){
        Good storage g = goods[goodId];
        return (g.name,g.pledge,g.dayRent,g.enabled,g.isRented,g.currentRenter,g.owner);
    }

    // 获取商品总数量
    function getGoodsCount() external view returns(uint256) {
        return goods.length;
    }

    // 获取单条租赁记录
    function getRentRecord(uint256 recordId) external view returns(
        uint256 goodId,
        address renter,
        uint256 startTime,
        bool finished
    ){
        RentRecord storage r = rentRecords[recordId];
        return (r.goodId, r.renter, r.startTime, r.finished);
    }

    // 获取租赁记录总数量
    function getRentRecordCount() external view returns(uint256) {
        return rentRecords.length;
    }

    // 获取商品评价列表
    function getReviews(uint256 goodId) external view returns(Review[] memory){
        return goodReviews[goodId];
    }

    // 接收转账
    receive() external payable{}
}