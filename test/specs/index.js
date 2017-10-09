import { join } from 'path'
import fetch from 'node-fetch'
import ethicalServer from 'ethical-utility-server'
import staticMiddleware from '../../src/index.js'

const baseURL = 'http://localhost:8080'
const appPath = join('test', 'files', 'dist')
const defaultConfig = {
    routes: join(appPath, 'Routes.js'),
    layout: join(appPath, 'Layout.js'),
    reducers: join(appPath, 'reducers', 'index.js')
}

const startServer = ({
    config = defaultConfig,
    requests = () => {},
    afterMiddleware = (ctx, next) => next()
}) => (
    ethicalServer()
    .use(staticMiddleware(config))
    .use(afterMiddleware)
    .listen()
    .then(destroyServer => {
        return new Promise(async resolve => {
            await requests()
            resolve(destroyServer)
        })
    })
    .then(destroyServer => destroyServer())
)

describe('staticMiddleware()', () => {
    it('should return the requested file', (done) => {
        const requests = async () => {
            const url = baseURL + '/test/files/static.js'
            const response = await fetch(url)
            const text = await response.text()
            expect(text.trim()).toBe('console.log("Hello World!")')
            expect(response.headers.get('Content-Type'))
            .toBe('application/javascript')
        }
        startServer({ requests })
        .then(done)
        .catch(e => console.error(e))
    })
    it('should return the html for the home page', (done) => {
        const requests = async () => {
            const url = baseURL + '/test/files/html'
            const response = await fetch(baseURL)
            const text = await response.text()
            expect(text).toBe('HTML')
        }
        const afterMiddleware = async ({ response }, next) => {
            expect(response.body).toBeUndefined()
            response.body = 'HTML'
            await next()
        }
        startServer({ requests, afterMiddleware })
        .then(done)
        .catch(e => console.error(e))
    })
})
