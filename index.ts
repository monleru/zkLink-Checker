import { createWalletClient, defineChain, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import chalk from "chalk";
import { gotScraping } from 'got-scraping';
import fs from 'fs'


const log = console.log

const zkLink = defineChain({
    id: 810180,
    name: 'zkLink Nova Mainnet',
    nativeCurrency: {
        decimals: 18,
        name: 'Ether',
        symbol: 'ETH',
    },
    rpcUrls: {
        default: {
            http: ['https://rpc.zklink.io'],
        },
    },
})


const checkEligible = async (privateKey:any) => {
    const account = privateKeyToAccount(privateKey) 
    const client = createWalletClient({
        account,
        chain: zkLink,
        transport: http(),
    })
      const signature = await client.signMessage({message: `Hello!
Please sign the message to confirm that you are the owner of this wallet`})
  
    const data = await gotScraping.post("https://app-api.zklink.io/api/auth/login",{json: { address: account.address, signature }}).json()
    const isElegible = await gotScraping("https://app-api.zklink.io/api/airdrop/info",{
        headers: {
            'Authorization': `Bearer ${data!.result}`
        }
    }).json().then(r => r.result.airdrop)

    if(!isElegible) {
        log(chalk.blue(account.address + ": ") + chalk.green("is eligible - ") + chalk.yellow(isElegible))
        return
    }

    const r = await  gotScraping("https://app-api.zklink.io/api/airdrop/loyaltyPoints",
        {
            headers: {
                'Authorization': `Bearer ${data.result}`
            }
        }
    ).json()
    log(chalk.blue(account.address + ": ") + chalk.green("is eligible - ") + chalk.yellow(isElegible) + ` || ${r.result.zklBase} ${chalk.green("ZKL")}`)
}

const start = async () =>  {
    const keys = (await fs.promises.readFile('./keys.txt','utf-8')).split('\n').map((i) => i.trim()).filter((i) => i.length > 0)
    for (const key of keys) {
        await checkEligible(key).catch(e => log(e?.message))
    }
}

start()