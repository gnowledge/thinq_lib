# ThinQ-Lib
ThinQ-Lib is a framework built over the [IPFS](https://ipfs.io/) network. It provides a way to enable storing files in a distrbuted file system along with encryption to ensure data privacy. It also uses a Graph-based data digest format - [GDF](https://github.com/Sreyas-108/GDF.git) to represent data internally.      
Currently, the framework offers the following features:
-  **Handshake:** Hnadshake refers to the process of two users sharing their unique id's on the network with each other, so that they can communicate with each other later. This is very similar to sharing phone numbers between users.       
- **Chatting:** Using the framework, users can directly share text messages with each other, without the involvement of any central server or authority. The messages that are transfered over the network are encrypted using asymmetric key cryptography, so that data privacy is maintained.      
- **File Sharing:** Users can also share files between each other using the framework. The important point to note here is that the file never actually leaves your system. Only the file of the hash is transmitted to other users, and whenever someone needs to access the file, they need to access it from your local machine. This is in-line with the aim of protecting user-data within the framework.       
- **Service Requests:** Service requests are pre-formatted text messages that are sent between users to perform specific tasks based on the requirements of the application developed using the framework. The difference between messages and requests is that requests need to be closed through a 3-way handshake mechanism to ensure that both parties have an equal say in the process.    
- **Prioritization of Requests:** Service requests can be prioritized based on ratings given by other users, in order to ensure that all nodes present on the network have good incentives to remain fair.  

## The Idea
The framework is created as an implementation of [the Idea](https://github.com/gnowledge/thinq_lib/blob/master/docs/conceptNote.md)

## Using the framework as a developer
You can install the leatest version on the package from the command line via 
`npm install @gnowledge/thinq_lib`
You can also install it by adding the following line to package.json
`@gnowledge/thinq_lib: ^[version_number]`
For a detailed explanation of all the functions and APIs exposed by the framework, please check out the documentation [here](https://github.com/gnowledge/thinq_lib/tree/master/docs/core-api)

## Contributing to the framework
To start contributing to the framework as a developer, refer the docs [here](https://github.com/PrarabdhGarg/thinq_lib/blob/master/docs/contributing.md)

## Future Plans
- #### Version 0.1.0
    * [x] Get the filebook API of the framework working
- #### Version 0.2.0
    * [ ] Add an option to include meta-data and extra information with service requests
    * [ ] Allow a single Service Provider to provide multiple services if they like
    * [ ] Add basic unit tests
- #### Other Plans
    * [ ] Expand the framework to take advantage of all the features of the IPFS framework
    * [ ] Support multiple layers and levels of encryption so that the developer can choose the appropriate one based on the requirements of the specific application being developed.
    * [ ] The method for storing user ratings is currently pretty insecure, and a better way using blockchain should be implemented
    * [ ] Add doc strings to the code so that new contributers find it easier to understand the code

## Examples
To find examples on how to build applications using this framework, please refer to [this repository](https://github.com/gnowledge/ThinQ-Examples).
