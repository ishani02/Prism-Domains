//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";
import {Base64} from "./libraries/Base64.sol";
import {StringUtils} from "./libraries/StringUtils.sol";

contract Domains is ERC721URIStorage {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds; // state variable that helps in setting a unique id foor our NFT

    error Unauthorized(string);
    error AlreadyRegistered();
    error InvalidName(string);
    
    address payable public owner;
    string tld; // top level domain like .eth, .sol etc
    uint public price;

    // svg for nft
    string svgP1 = '<svg xmlns="http://www.w3.org/2000/svg" width="270" height="270" fill="none"><path fill="url(#B)" d="M0 0h270v270H0z"/><defs><filter id="A" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="270" width="270"><feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity=".225" width="200%" height="200%"/></filter></defs><path d="M72.863 42.949c-.668-.387-1.426-.59-2.197-.59s-1.529.204-2.197.59l-10.081 6.032-6.85 3.934-10.081 6.032c-.668.387-1.426.59-2.197.59s-1.529-.204-2.197-.59l-8.013-4.721a4.52 4.52 0 0 1-1.589-1.616c-.384-.665-.594-1.418-.608-2.187v-9.31c-.013-.775.185-1.538.572-2.208a4.25 4.25 0 0 1 1.625-1.595l7.884-4.59c.668-.387 1.426-.59 2.197-.59s1.529.204 2.197.59l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616c.384.665.594 1.418.608 2.187v6.032l6.85-4.065v-6.032c.013-.775-.185-1.538-.572-2.208a4.25 4.25 0 0 0-1.625-1.595L41.456 24.59c-.668-.387-1.426-.59-2.197-.59s-1.529.204-2.197.59l-14.864 8.655a4.25 4.25 0 0 0-1.625 1.595c-.387.67-.585 1.434-.572 2.208v17.441c-.013.775.185 1.538.572 2.208a4.25 4.25 0 0 0 1.625 1.595l14.864 8.655c.668.387 1.426.59 2.197.59s1.529-.204 2.197-.59l10.081-5.901 6.85-4.065 10.081-5.901c.668-.387 1.426-.59 2.197-.59s1.529.204 2.197.59l7.884 4.59a4.52 4.52 0 0 1 1.589 1.616c.384.665.594 1.418.608 2.187v9.311c.013.775-.185 1.538-.572 2.208a4.25 4.25 0 0 1-1.625 1.595l-7.884 4.721c-.668.387-1.426.59-2.197.59s-1.529-.204-2.197-.59l-7.884-4.59a4.52 4.52 0 0 1-1.589-1.616c-.385-.665-.594-1.418-.608-2.187v-6.032l-6.85 4.065v6.032c-.013.775.185 1.538.572 2.208a4.25 4.25 0 0 0 1.625 1.595l14.864 8.655c.668.387 1.426.59 2.197.59s1.529-.204 2.197-.59l14.864-8.655c.657-.394 1.204-.95 1.589-1.616s.594-1.418.609-2.187V55.538c.013-.775-.185-1.538-.572-2.208a4.25 4.25 0 0 0-1.625-1.595l-14.993-8.786z" fill="#fff"/><defs><linearGradient id="B" x1="0" y1="0" x2="270" y2="270" gradientUnits="userSpaceOnUse"><stop stop-color="#cb5eee"/><stop offset="1" stop-color="#0cd7e4" stop-opacity=".99"/></linearGradient></defs><text x="32.5" y="231" font-size="27" fill="#fff" filter="url(#A)" font-family="Plus Jakarta Sans,DejaVu Sans,Noto Color Emoji,Apple Color Emoji,sans-serif" font-weight="bold">';
    string svgP2 = '</text></svg>';
    string[] userData; // array of data to which the domain points or redirects

    mapping(string => address) public domains; // user's domain name => user's address
    mapping(string => string) public records; // domain name => data
    mapping(uint => string) public names; // idx value => domain name
    
    modifier onlyOwner() {
        require(msg.sender == owner,"Domains: Only owner can access this");
        _;
    }

    constructor(string memory _tld) payable ERC721("Prism Name Service", "PNS") {
        owner = payable(msg.sender);
        console.log("Welcome to shine name service");
        tld = _tld;
        console.log("Top-level domain is set as:",tld);
    }

    function domainPrice(string calldata name) public returns(uint) {
        uint len = StringUtils.strlen(name); // convert sting to bytes and its length will be uint
        require(len != 0, "Domains: Enter a valid domain name");
        
        if(len <= 3) {
            price = 5 * 10**17; // 0.5 MATIC
        } else if(len > 3 && len <= 4) {
            price = 3 * 10**17; // 0.3 MATIC
        } else {
            price = 1 * 10**17; // 0.1 MATIC
        }

        return price;
    }

    function register(string calldata name) public payable {
        //require(domains[name] == address(0), "Domains: Domain name already taken");
        if(domains[name] != address(0)) revert AlreadyRegistered();
        //require(isValid(name), "Domains: Domain name too long");
        if(!isValid(name)) revert InvalidName(name);
        uint cost = domainPrice(name);
        console.log("calculated price",cost);
        
        require(msg.value >= cost, "Domains: Insufficient Matic paid");
        console.log("minting domain");
        
        // strings cannot be combined directly, abi.encodePacked converts them into bytes and then combines them
        string memory _name = string(abi.encodePacked(name, ".", tld));
       
        string memory finalSvg = string(abi.encodePacked(svgP1, _name, svgP2)); // combining domain name with svg eg. <svg>my domain</svg>
        
        uint newRecordId = _tokenIds.current();

        uint length = StringUtils.strlen(name);
        string memory strLen = Strings.toString(length);

        console.log("Registering %s.%s on the contract with tokenID %d", name, tld, newRecordId);

        // NFTs store metadata(name, description, attributes etc) in the form of JSON 
        string memory json = Base64.encode(
            abi.encodePacked(
                '{"name": "',
                _name,
                '", "description": "A domain on the Shine name service", "image": "data:image/svg+xml;base64,',
                Base64.encode(bytes(finalSvg)),
                '","length":"',
                strLen,
                '"}'
            )
          );
          
          string memory finalTokenUri = string(abi.encodePacked("data:application/json;base64,", json));
          _safeMint(msg.sender, newRecordId);
          _setTokenURI(newRecordId, finalTokenUri);
          console.log("\n--------------------------------------------------------");
          console.log("Final token uri for this nft is: ", finalTokenUri);
          domains[name] = msg.sender;
          console.log("\n--------------------------------------------------------");
          
         names[newRecordId] = _name; // store domain name at index = id in 'names' mapping 
        _tokenIds.increment();

        console.log(msg.sender," Your domain has been registered");
    }
    
    function attachDataToDomain(string calldata name, string memory data) public {
        //require(domains[name] == msg.sender, "Domains: Only owner of domain can add data!!");
        if(domains[name] != msg.sender) revert Unauthorized("Only owner of domain can add data!!");
        records[name] = data;
    }

    function withdraw() public onlyOwner {
        uint amount = address(this).balance;

        (bool success,) = msg.sender.call{value: amount}("");
        require(success, "Failed to withdraw Matic");
    }

    function isValid(string calldata name) public pure returns(bool) {
        return StringUtils.strlen(name) >= 3 && StringUtils.strlen(name) < 10;
    }

    function getAllNames() public view returns(string[] memory) {
        string[] memory allNames = new string[](_tokenIds.current());

        for(uint i = 0; i < _tokenIds.current(); i++) {
            allNames[i] = names[i];
            console.log("%s is the domain name at id %d", allNames[i], i);
        }
        return allNames;
    }

    function getDomain(string calldata name) public view returns(address) {
        return domains[name];
    }

    function getData(string calldata name) public view returns (string memory) {
        return records[name];
    }

}