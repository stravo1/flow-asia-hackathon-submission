// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.22;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

// import "hardhat/console.sol";

contract FlowHackathonNFT is
    ERC721,
    ERC721URIStorage,
    Ownable,
    ReentrancyGuard
{
    uint256 private _nextTokenId;
    uint256 public mintPrice;
    bool public mintingEnabled;

    mapping(uint256 => uint256) public tokenIdToPrice;

    event MintPriceUpdated(uint256 newPrice);
    event MintingStatusUpdated(bool enabled);
    event TokenMinted(
        address indexed _to,
        uint256 indexed _tokenId,
        string _uri
    );
    event NftCreated(uint256 _tokenId, string _uri);
    event NftBought(address _seller, address _buyer, uint256 _price);
    event NftListed(uint256 _tokenId, uint256 _price);
    event NftDelisted(uint256 _tokenId);

    constructor(
        address initialOwner
    ) ERC721("FlowHackathonNFT", "FHNFT") Ownable(initialOwner) {
        // console.log("FlowHackathonNFT constructor");
        // console.log("initialOwner", initialOwner);
        // console.log("creator", msg.sender);
    }

    // Set the mint price (only owner)
    function setMintPrice(uint256 newPrice) external onlyOwner {
        require(newPrice > 0, "Mint price must be greater than zero");
        mintPrice = newPrice;
        emit MintPriceUpdated(newPrice);
    }

    // Enable or disable minting (only owner)
    function setMintingEnabled(bool enabled) external onlyOwner {
        mintingEnabled = enabled;
        emit MintingStatusUpdated(enabled);
    }

    function _mint(address to, string memory uri) private {
        uint256 tokenId = _nextTokenId++;
        tokenIdToPrice[tokenId] = 0;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);
        emit TokenMinted(to, tokenId, uri);
        emit NftCreated(tokenId, uri);
    }

    // Public mint function with a required mint price
    function mint(string memory uri) external payable nonReentrant {
        require(mintingEnabled, "Minting is not enabled");
        require(msg.value == mintPrice, "Incorrect Ether amount sent");

        _mint(msg.sender, uri);
    }

    function ownerMint(address to, string memory uri) public onlyOwner {
        _mint(to, uri);
    }

    function updateTokenURI(uint256 tokenId, string memory newUri) external {
        require(
            msg.sender == ownerOf(tokenId) || msg.sender == owner(),
            "Not authorized"
        );
        _setTokenURI(tokenId, newUri);
    }

    function tokenURI(
        uint256 tokenId
    ) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function allowBuy(uint256 _tokenId, uint256 _price) external {
        require(msg.sender == ownerOf(_tokenId), "Not owner of this token");
        require(_price > 0, "Price zero");
        tokenIdToPrice[_tokenId] = _price;
        emit NftListed(_tokenId, _price);
    }

    function disallowBuy(uint256 _tokenId) external {
        require(msg.sender == ownerOf(_tokenId), "Not owner of this token");
        tokenIdToPrice[_tokenId] = 0;
        emit NftDelisted(_tokenId);
    }

    function buy(uint256 _tokenId) external payable {
        uint256 price = tokenIdToPrice[_tokenId];
        require(
            msg.sender != ownerOf(_tokenId),
            "You are the owner of this token"
        );
        require(price > 0, "This token is not for sale");
        require(msg.value == price, "Incorrect value");

        address seller = ownerOf(_tokenId);
        _transfer(seller, msg.sender, _tokenId);
        tokenIdToPrice[_tokenId] = 0; // not for sale anymore
        payable(seller).transfer(msg.value); // send the ETH to the seller

        emit NftBought(seller, msg.sender, msg.value);
        emit NftDelisted(_tokenId);
    }
}
