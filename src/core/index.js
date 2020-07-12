const IPFS = require('ipfs')
const path = require('path')
const Room = require('ipfs-pubsub-room')
const database = require('../../models/database')
const cryptography = require('../util/cryptography')
const messages = require('./messages')
const messageAction = require('./messageAction')


async function init(args = {}){
    let repo_path = args.hasOwnProperty('path') ? args.path : path.join(__dirname , 'ipfs/thinq/')
    let room_name = args.hasOwnProperty('rname') ? args.rname : 'room1'
    let callback = args.hasOwnProperty('messageCallback') ? args.messageCallback : () => {}
    let pass = args.hasOwnProperty('passphrase') ? args.passphrase : 'This is a long and hard to guess String that acts as a passphrase @&$($'
    let user = args.hasOwnProperty('user') ? args.user : 'ThinQuser'
    let email = args.hasOwnProperty('email') ? args.email : 'example@example.com'
    let passphrase = {
        pass: pass,
        user: user,
        email: email
    }
 
    const node = await IPFS.create({
        repo:  repo_path,
        init: true,
        EXPERIMENTAL: {
            pubsub: true
        },
        config: {
            Addresses: {
              Swarm: [
                '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
              ]
            }
        }
    })

    const id = await node.id()
    console.log('IPFS node running with id ', id.id)
    const room = Room(node, room_name)

    let db = await database.db_init(args)

    for(model of Object.keys(db))
        await db[model].sync({force: false})

    room.on('peer joined', (cid) => {
        db.PendingMessages.findAll({
            where: {
                reciver: cid
            }
        }).then((res) => {
            if(res.length != 0) {
                for (let message of res) {
                    messages.sendMessageToUser(message, cid)
                }
                db.PendingMessages.destroy({
                    where: {
                        id: message.id
                    }
                })
            }
        })
    })

    room.on('message', (message) => {
        console.log('Inside actual message listener')
        messages.onMessageRecived({
            db: db,
            node: node,
            room: room,
            passphrase: passphrase
        }, message, callback)
    })

    return {
        db : db ,
        node : node ,
        room : room,
        passphrase: passphrase
    }
}

async function register(init_info , args){
    info = await args.node.id()
    await cryptography.generateKeys(args.passphrase)
    let public_key = cryptography.getPublicKey()

    stats = await Promise.all([args.node.add(public_key) , args.node.add(init_info.bio)])
    init_info['publicKey'] = stats[0][0].hash.toString()
    init_info['ipfs'] = info.id.toString()
    init_info['bio'] = stats[1][0].hash.toString()
    init_info['rating'] = '2.5'

    stat = await args.node.add(JSON.stringify(init_info))
    user = await args.db.User.create({name:init_info.name , ipfs:info.id , bio:init_info.bio, publicKey:stats[0][0].hash.toString(), type:init_info.type , rating: '2.5' , filehash:stat[0].hash.toString()})
    return stat[0].path
}

async function addUser(id, name, args){
    let [info] = await args.node.get(id)

    let user_info = await JSON.parse(info.content.toString())
    await args.db.User.create({type:user_info.type , name:name , filehash:id , publicKey:user_info.publicKey , ipfs:user_info.ipfs , bio:user_info.bio , rating: user_info.rating})
    
    let [bio] = await args.node.get(user_info.bio)
    user_info['bio'] = bio.content.toString()
    user_info['name'] = name
    
    return user_info
}


//to update self send the parameter in updates, to update others send filehash as a parameter in updates
async function updateInfo(updates , args , ipfs="self") {
    if(ipfs=="self")
        ipfs = (await args.node.id()).id
    args.db.User.findOne({where : {ipfs:ipfs}}).then(async (result) => {
        let prevFileHash = result.dataValues.filehash

        if(updates.hasOwnProperty('filehash')){
            await args.db.User.delete({where: {ipfs:ipfs}})
            addUser(filehash , args)
            return
        }

        args.node.get(prevFileHash).then(async ([file]) => {
            data = JSON.parse(file.content.toString())
            
            if(updates.hasOwnProperty('bio')){
                let stat = await args.node.add(updates.bio)
                updates.bio = stat.hash.toString()
            }

            let new_info = result.dataValues

            for(key of Object.keys(updates))
                new_info[key] = updates[key]

            args.node.add(JSON.stringify(new_info)).then(([stat]) => {
                new_info.filehash = stat.hash.toString()

                args.db.User.update({new_info}, {where: {ipfs: ipfs}}).then((result1) => {
                    console.log('Database updated sucessfully')
                })
            })
        })
    })
}

async function getUsers(args) {
    let users = await args.db.User.findAll({})
    for(let i=0 ; i<users.length ; i++)
        users[i] = users[i].dataValues
        
    return users
}

async function getFileContent(cid , args) {
    let [file] = await args.node.get(cid)
    return file.content.toString()
}

module.exports = {
    init: init,
    getUsers: getUsers,
    updateInfo: updateInfo,
    addUser: addUser,
    register: register,
    getFileContent: getFileContent
}



