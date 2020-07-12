var expect = require("chai").expect
var thinQ = require('../src/core/index')
const { assert } = require("chai")

describe("index.js", function() {
    describe("init", function() {
        it('initialization without arguments', async function() {
            var args = await thinQ.init()
            assert(args.db)
            assert(args.node)
            assert(args.room)
            assert(args.passphrase)
            await args.node.stop()
        })

        it('initialization with passphrase username and email arguments', async function() {
            var pass = "This is a test passphrase"
            var user = "Test User"
            var email = "test@test.com"

            var args = await thinQ.init({
                passphrase: pass,
                user: user,
                email: email
            })

            assert(args.db)
            assert(args.node)
            assert(args.room)
            expect(args.passphrase.pass).to.equal(pass)
            expect(args.passphrase.user).to.equal(user)
            expect(args.passphrase.email).to.equal(email)
            await args.node.stop()
        })

        it('initialization with path argument', async function() {
            var args = await thinQ.init({
                path: '/thinq'
            })
            assert(args.db)
            assert(args.node)
            assert(args.room)
            assert(args.passphrase)
            await args.node.stop()
        })

        it('initialization with rname argument', async function() {
            const rname = 'Test Room'

            var args = await thinQ.init({
                rname: rname
            })
            assert(args.db)
            assert(args.node)
            expect(args.room._topic).to.equal(rname)
            assert(args.passphrase)
            await args.node.stop()
        })
    })

    describe("register", function() {
        beforeEach(async function() {
            this.args = await thinQ.init()
        })

        afterEach(async function() {
            await this.args.node.stop()
        })

        it('works with complete info object', async function() {
            const result = await thinQ.register({
                name: 'Test User 1',
                bio: 'This is a test bio',
                type: 1
            }, this.args)
            assert(result)
        })

        it('throws error with incomplete info object', async function() {
            try {
                const result = await thinQ.register({
                    name: 'Test User 1',
                    type: 1
                }, this.args)
            } catch(e) {
                expect(e.message).to.equal('Unexpected input: undefined')
            }
        })

        it('throws error with null args object', async function() {
            try {
                const result = await thinQ.register({
                    name: 'Test User 1',
                    bio: 'This is a test bio',
                    type: 1
                }, null)
            } catch(e) {
                expect(e.message).to.equal('Cannot read property \'node\' of null')
            }
        })
    })

    describe('addUser', function() {
        beforeEach(async function() {
            this.args = await thinQ.init()
        })

        afterEach(async function() {
            await this.args.node.stop()
        })

        it('works with correct arguments', async function() {
            const args2 = await thinQ.init({
                path:'thinq/Path2'
            })
            const id = (await this.args.node.id()).id
            const result = await thinQ.register({
                name: 'Test User 1',
                bio: 'This is a test bio',
                type: 1
            }, this.args)
            var user_info = await thinQ.addUser(result, 'Test User 2', args2)
            expect(user_info.name).to.equal('Test User 2')
            await args2.node.stop()  
        })
    })

    describe('getUsers', function() {
        beforeEach(async function() {
            this.args = await thinQ.init()
        })

        afterEach(async function() {
            await this.args.node.stop()
        })

        it('returns correct list of users', async function() {
            var list = await thinQ.getUsers(this.args)
            assert(list)
        })
    })

    // TODO: Add Tests for updateInfo
    // TODO: Add Tests for getFileContent
})