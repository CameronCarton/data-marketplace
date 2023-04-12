import { ethers } from 'ethers'

const Navigation = ({account, setAccount}) => {

const connectWallet = async () => {
    const accounts = await window.ethereum.request({method: 'eth_requestAccounts'});
    const account = ethers.utils.getAddress(accounts[0]);
    setAccount(account);
    console.log("connected wallet")
}
    return(
    <nav class="navbar">
        <div class="navbar-container">
            <a href="https://nextjs.org" id="navbar-logo"> </a>
            <ul class="navbar-menu">
                <li class="navbar-item">
                <a href="https://nextjs.org" class="navbar-links">Marketplace</a>
                </li>
                <li class="navbar-item">
                <a href="https://nextjs.org" class="navbar-links">About</a>
                </li>
                    {account ? (
                        <></>
                    ):(
                        <div id="wallet-container">
                            <button id="connect-wallet-button" onClick={connectWallet}>Connect Wallet</button>
                            <div id="message-container"></div>
                        </div>
                    )}
                
            </ul>
        </div>
    </nav>
    );
}

export default Navigation;