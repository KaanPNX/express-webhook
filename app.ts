import express,{Express,Request,Response,NextFunction} from 'express';
import http from "http";
import router from './Router/mainRoute';
import * as cons from 'consolidate';
import * as path from 'path';
import './Database/database';

const app : Express = express();
var server = http.createServer(app);

server.listen(3000,() => {
    console.log('[Server] Server started with 3000 port.');
});

app.engine('html', cons.swig)
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.enable('trust proxy');

app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.use((req: Request, res:Response,next: NextFunction) => {
    res.setHeader('content-type','application/json');
    res.setHeader('charset','utf8');
    res.setHeader('X-Powered-By','643077ed7b14af1f') 
    next();
})

app.use('/',router)

app.use((req: Request, res:Response,next: NextFunction) => {
    res.render('404');
});

