const message = require('./messages')


const RequestStatus = {
    sent:1,
    pending:2,
    created:3,
    sp_ack:4,
    c_ack:5

}
// Returns a list of all the sent requests
async function sentRequests(args){
    let [requests]=await args.db.ServiceRequest.findAll({where: {status: RequestStatus.sent}})
        let promises = []
        for(request of requests)
            promises.push(args.db.User.findOne({where: {ipfs:request.dataValues.sender}}))

       let users= await Promise.all(promises)
            for(let i=0 ; i<requests.length ; i++)
                requests[i].dataValues.sender = users[i].dataValues.name
                
            return {requestType: "Sent" , requests:requests}
}


// Returns a list of all the pending requests sorted by priority
async function pendingRequests(args, limit, offset){
    let [requests]=await args.db.ServiceRequest.findAll({where: {status: RequestStatus.pending},order:[['priority']],
    limit: limit,
    offset: offset})
        let promises = []
        for(request of requests)
            promises.push(args.db.User.findOne({where: {ipfs:request.dataValues.sender}}))

       let users=await Promise.all(promises)
            for(let i=0 ; i<requests.length ; i++)
                requests[i].dataValues.sender = users[i].dataValues.name
                
            return {requestType: "Pending" , requests:requests}
}

// Returns a list of all the created close requests-whether as consumer or service provider
async function createdcRequests(args){
    let [requests]= await args.db.ServiceRequest.findAll({where: {status: RequestStatus.created}})
        let promises = []
        for(request of requests)
            promises.push(args.db.User.findOne({where: {ipfs:request.dataValues.sender}}))

            let users=await Promise.all(promises)
            for(let i=0 ; i<requests.length ; i++)
                requests[i].dataValues.sender = users[i].dataValues.name
                
            return {requestType: "Created" , requests:requests}
}

// Returns a list of all the close requests to be acknowledged as an SP (Step 2)
async function createdspRequests(args){
    let [requests]= await args.db.ServiceRequest.findAll({where: {status: RequestStatus.created,display:"2"}})
        let promises = []
        for(request of requests)
            promises.push(args.db.User.findOne({where: {ipfs:request.dataValues.sender}}))

        let users=await Promise.all(promises)
            for(let i=0 ; i<requests.length ; i++)
                requests[i].dataValues.sender = users[i].dataValues.name
                
            return {requestType: "CreatedSP" , requests:requests}
}

// Returns a list of all the close requests to be acknowledged as a consumer (Step 3)
async function spackRequests(args){
    let [requests]= await args.db.ServiceRequest.findAll({where: {status: RequestStatus.sp_ack,display:"2"}})
        let promises = []
        for(request of requests)
            promises.push(args.db.User.findOne({where: {ipfs:request.dataValues.sender}}))

        let users=await Promise.all(promises)
            for(let i=0 ; i<requests.length ; i++)
                requests[i].dataValues.sender = users[i].dataValues.name
                
            return {requestType: "SP_Acknowledged" , requests:requests}
}

// Returns a list of all the resolved requests
async function cackRequests(args){
    let [requests]= await args.db.ServiceRequest.findAll({where: {status: RequestStatus.c_ack}})
        let promises = []
        for(request of requests)
            promises.push(args.db.User.findOne({where: {ipfs:request.dataValues.sender}}))

        let users=await Promise.all(promises)
            for(let i=0 ; i<requests.length ; i++)
                requests[i].dataValues.sender = users[i].dataValues.name
                
            return {requestType: "Resolved" , requests:requests}
}


// Sends requests to the SP
async function addRequests(sender_ipfs,args){
    let result= await args.db.ServiceRequest.create({sender:sender_ipfs , status: RequestStatus.sent})
        let info=await args.node.id()
            let msg = {
                sender : info.id,
                recipient: sender_ipfs,
                action: message.messageAction.REQUEST
            }
            console.log(sender_ipfs)
            let result=await message.sendMessageToUser(msg ,sender_ipfs)
                console.log("Request successfully added")

}

// Deletes request
async function deleteRequests(sender_name,args){
    let sender=await args.db.User.findOne({where: {name:sender_name}})
        let result=await args.db.ServiceRequest.destroy({where: {sender: sender.dataValues.ipfs, status: RequestStatus.sent}})
        let info=await args.node.id()
            let result=await message.sendMessageToUser({
                    sender: info.id,
                    recipient: sender.dataValues.ipfs,
                    action: message.messageAction.DELETE
                } , sender.dataValues.ipfs)
                    console.log("Request successfully deleted")

}

// Initiates the resolution process from consumer's side and creates a close request
async function createcRequests(sender_name,args){
    let sender = await args.db.User.findOne({where: {name:sender_name}})
    let result=await args.db.ServiceRequest.destroy({where: {sender: sender.dataValues.ipfs, status: RequestStatus.sent}})
    let result=await args.db.ServiceRequest.create({sender:sender.dataValues.ipfs , status: RequestStatus.created,display:"1"}) 
        let info=await args.node.id()
            let result=await message.sendMessageToUser({
                sender: info.id,
                recipient: sender.dataValues.ipfs,
                action: message.messageAction.C_CREATE
            } , sender.dataValues.ipfs)
                console.log("Close request sent.")
}

// Initiates the resolution process from SP's side
async function spcreatecRequests(sender_name,args){
    let sender=await args.db.User.findOne({where: {name:sender_name}})
    let result=await args.db.ServiceRequest.destroy({where: {sender: sender.dataValues.ipfs, status: RequestStatus.pending}})
        let result=await args.db.ServiceRequest.create({sender:sender.dataValues.ipfs , status: RequestStatus.created,display:"2"})
        let info=await args.node.id()
            let result=await message.sendMessageToUser({
                sender: info.id,
                recipient: sender.dataValues.ipfs,
                action: message.messageAction.SP_C_CREATE
            } , sender.dataValues.ipfs)
                console.log("Close request sent.")
}

// The other party acknowledges the request and rates the party which initiated the process
async function sp_ack_request(sender_name,userRating,documentPath,args){
    let sender=await args.db.User.findOne({where: {name:sender_name}})
        let prevrating
        let flag
        let rating
        let transactions
        let promises = []
            args.node.files.read(documentPath
                , (err, res) => {
                    if(err) {
                        rating=userRating
                        transactions=1
                        args.node.files.write(documentPath, Buffer.from(sender.dataValues.ipfs+ '|'+ rating+ '|' +transactions), {
                            create: true,
                            parents: true
                            }, (err, res) => {
                             if(err) {
                                console.log("--------------------------Error in inserting file " + err.message)
                            } 
                            else {
                            args.node.files.stat(documentPath, (err, respon) => {
                            if(err) {
                                console.log("Error in inserting rating" + err.message)
                            }
                            console.log('Stat Result = ' + JSON.stringify(respon))
                            hash = respon.hash
                            console.log('File Hash = ' + hash)
                            })
                            }
                            })
                            let result=await args.db.ServiceRequest.update({status:RequestStatus.sp_ack,display:"1"},{where: {sender:sender.dataValues.ipfs , status: RequestStatus.created}})
                                let info=await args.node.id()
                                   let result=await message.sendMessageToUser({
                                        sender: info.id,
                                        recipient: sender.dataValues.ipfs,
                                        action:message.messageAction.SP_ACK,
                                        rating:rating.toString(),
                                        transact:transactions.toString()
                                    } , sender.dataValues.ipfs)
                                        console.log("Request acknowledged")
                              
                   } 
                   else {
                    promises.push(res)
                    let results=await Promise.all(promises)
                        console.log("Reults are",results[0].toString())
                        prevrating=results[0].toString()
                        if(prevrating !== undefined)
                        {   
                            console.log("Entering if condition")
                            console.log("previous rating is:",parseFloat((prevrating.split("|")[1])))
                            console.log("Rating provided is:",parseInt(userRating))
                            rating=(parseFloat((prevrating.split("|")[1])*parseInt(prevrating.split("|")[2])+parseInt(userRating)))/(parseInt(prevrating.split("|")[2])+1)
                            transactions=parseInt(prevrating.split("|")[2])+1
                            console.log("New rating is:",rating)
                            console.log("transaction number is",transactions)
                        }
                        else
                        {   
                            console.log("Entering else condition")
                            rating=userRating
                            transactions=1
                        }
                        args.node.files.write(documentPath, Buffer.from(prevrating.split("|")[0]+ '|'+rating + '|' + transactions), {
                            create: true,
                            parents: true
                            }, (err, res) => {
                             if(err) {
                                console.log("Error in inserting file " + err.message)
                            } 
                            else {
                            args.node.files.stat(documentPath, (err, respon) => {
                            if(err) {
                                console.log("Error in inserting rating" + err.message)
                            }
                            console.log('Stat Result = ' + JSON.stringify(respon))
                            hash = respon.hash
                            let result=await args.db.User.update({ratinghash:hash},{where: {ipfs:sender.dataValues.ipfs}})
                                console.log("The updated hash spack is:",hash)
                            })
                            console.log('File Hash = ' + hash)
                            }
                            })
                            let result=await args.db.ServiceRequest.update({status:RequestStatus.sp_ack,display:"1"},{where: {sender:sender.dataValues.ipfs , status: RequestStatus.created}})    
                                let info=await args.node.id()
                                    let result=await message.sendMessageToUser({
                                        sender: info.id,
                                        recipient: sender.dataValues.ipfs,
                                        action: message.messageAction.SP_ACK,
                                        rating:rating.toString(),
                                        transact:transactions.toString()
                                    } , sender.dataValues.ipfs)
                                        console.log("Request acknowledged")
                                }
})
}

// The party which initiated the process completes it and rated the other party
async function c_ack_request(sender_name,userRating,documentPath,args){
    let sender=await args.db.User.findOne({where: {name:sender_name}})
    let prevrating
    let flag
    let rating
    let transactions
    let promises = []
        args.node.files.read(documentPath
            , (err, res) => {
                if(err) {
                    rating=userRating
                    transactions=1
                    args.node.files.write(documentPath, Buffer.from(sender.dataValues.ipfs+ '|'+ rating+ '|' +transactions), {
                        create: true,
                        parents: true
                        }, (err, res) => {
                         if(err) {
                            console.log("--------------------------Error in inserting file " + err.message)
                        } 
                        else {
                        args.node.files.stat(documentPath, (err, respon) => {
                        if(err) {
                            console.log("Error in inserting rating" + err.message)
                        }
                        console.log('Stat Result = ' + JSON.stringify(respon))
                        hash = respon.hash
                        console.log('File Hash = ' + hash)
                        })
                        }
                        })
                        let result=await args.db.ServiceRequest.update({status:RequestStatus.c_ack},{where: {sender:sender.dataValues.ipfs , status: RequestStatus.sp_ack}})
                            let info=await args.node.id()
                               let result=await message.sendMessageToUser({
                                    sender: info.id,
                                    recipient: sender.dataValues.ipfs,
                                    action:message.messageAction.C_ACK,
                                    rating:rating.toString(),
                                    transact:transactions.toString()
                                } , sender.dataValues.ipfs)
                                    console.log("Resolution process complete")
                          
               } 
               else {
                promises.push(res)
                let results=await Promise.all(promises)
                    console.log("Reults are",results[0].toString())
                    prevrating=results[0].toString()
                    if(prevrating !== undefined)
                    {   
                        console.log("Entering if condition")
                        console.log("previous rating is:",parseFloat((prevrating.split("|")[1])))
                        console.log("Rating provided is:",parseInt(userRating))
                        rating=(parseFloat((prevrating.split("|")[1])*parseInt(prevrating.split("|")[2])+parseInt(userRating)))/(parseInt(prevrating.split("|")[2])+1)
                        transactions=parseInt(prevrating.split("|")[2])+1
                        console.log("New rating is:",rating)
                        console.log("transaction number is",transactions)
                    }
                    else
                    {   
                        console.log("Entering else condition")
                        rating=userRating
                        transactions=1
                    }
                    args.node.files.write(documentPath, Buffer.from(prevrating.split("|")[0]+ '|'+rating + '|' + transactions), {
                        create: true,
                        parents: true
                        }, (err, res) => {
                         if(err) {
                            console.log("Error in inserting file " + err.message)
                        } 
                        else {
                        args.node.files.stat(documentPath, (err, respon) => {
                        if(err) {
                            console.log("Error in inserting rating" + err.message)
                        }
                        console.log('Stat Result = ' + JSON.stringify(respon))
                        hash = respon.hash
                        let result=await args.db.User.update({ratinghash:hash},{where: {ipfs:sender.dataValues.ipfs}})
                            console.log("The updated hash spack is:",hash)
                        })
                        console.log('File Hash = ' + hash)
                        }
                        })
                        let result=await args.db.ServiceRequest.update({status:RequestStatus.c_ack},{where: {sender:sender.dataValues.ipfs , status: RequestStatus.sp_ack}})    
                            let info=await args.node.id()
                                let result=await message.sendMessageToUser({
                                    sender: info.id,
                                    recipient: sender.dataValues.ipfs,
                                    action: message.messageAction.C_ACK,
                                    rating:rating.toString(),
                                    transact:transactions.toString()
                                } , sender.dataValues.ipfs)
                                    console.log("Resolution process complete")
                            }
})
}


module.exports={
    RequestStatus:RequestStatus,
    sentRequests:sentRequests,
    pendingRequests:pendingRequests,
    createdcRequests:createdcRequests,
    createdspRequests:createdspRequests,
    spackRequests:spackRequests,
    cackRequests:cackRequests,
    addRequests:addRequests,
    deleteRequests:deleteRequests,
    createcRequests:createcRequests,
    spcreatecRequests:spcreatecRequests,
    sp_ack_request:sp_ack_request,
    c_ack_request:c_ack_request
}