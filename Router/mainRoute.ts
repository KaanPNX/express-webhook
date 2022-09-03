import express,{Router,Request,Response,NextFunction} from 'express';
const router : Router = express();
import * as crypt from 'bcrypt';
import jwt, { sign, SignOptions } from 'jsonwebtoken';
import db  from '../Database/database';
import SnowFlake from '../Utils/Snowflake';

router.post('/login',async(req: Request<{username: string, password: string}>, res:Response) => {
    db.serialize(() => {
        db.all(`SELECT * FROM user WHERE email= '${req.body.username}'`,async (err,row) =>{
            if(row[0] == undefined)return res.send(JSON.stringify({code: '403', message: 'Access denied.'}));
            console.log(req.body.password, row[0].Password);
            if(await crypt.compare(req.body.password, row[0].Password)){
                const sigInOpt: SignOptions = {
                    algorithm: 'HS256',
                    expiresIn: '24h'                
                }
                var token = sign({user: {id: row[0].UserID}},"N05EUnVpdDQ4dTYmNFI2cCEyRHJOZXVSSTYxTSFAZXl5OU1zejEmeWdOJUBwOFJMJWs",sigInOpt)
                return res.send(JSON.stringify({id:row[0].UserID, username: row[0].Email, token: token}));
            }else{
                return res.send(JSON.stringify({code: '403', message: 'Access denied.'}));
            }
        });
    });    
});


router.post('/webhook/:id/messages',async(req: Request<{content: string, id: number}>, res:Response,next: NextFunction) => {
    if(req.body.content == undefined)return res.send({code: 4003, message: 'Invalid Form Body.'});
    if(!Number(req.params.id)){return res.send({code: 4005, message: 'Invalid Webhook Id.'})}
    db.serialize(() => {
        db.all(`SELECT * FROM webhook WHERE WebhookID=${req.params.id}`,(err,row) => {
            if(!row[0])return res.send({code: 4005, message: 'Webhook invalid.'})
            db.exec(`INSERT INTO message (MessageID,WebhookID,Content) VALUES(${SnowFlake()}, ${req.params.id}, '${req.body.content}')`);
            return res.send({code: 200, message: 'OK'});
        });
    });
});

router.use((req: Request, res:Response,next: NextFunction) => {
    let token = req.headers.authorization;
    if(token == undefined)return res.send(JSON.stringify({code: '403', message: 'Access denied.'}));
    const decoded = jwt.decode(token, {complete: true});
    if (decoded === null) {return res.status(401).send(JSON.stringify({code: '403', message: 'Access denied.'}));}
    if(decoded !== null) next();
});


router.post('/webhook/',async(req: Request, res:Response,next: NextFunction) => {
    let token = req.headers.authorization;
    if(token == undefined)return res.send(JSON.stringify({code: '403', message: 'Access denied.'}));
    const decoded = jwt.decode(token, {complete: true});
    if (decoded === null) {return res.status(401).send(JSON.stringify({code: '403', message: 'Access denied.'}));}

    let payload : any = decoded.payload; let id = payload.user.id;

    try {
        db.exec(`INSERT INTO webhook (WebhookID,UserID) VALUES(${SnowFlake()},${id})`);
        return res.send({code: 200, message: 'OK'});
    } catch (error) {
        if(error)console.log(error);
    }
});


router.delete('/webhook/:id/',async(req: Request, res:Response,next: NextFunction) => {
    let token = req.headers.authorization;
    if(token == undefined)return res.send(JSON.stringify({code: '403', message: 'Access denied.'}));
    const decoded = jwt.decode(token, {complete: true});
    if (decoded === null) {return res.status(401).send(JSON.stringify({code: '403', message: 'Access denied.'}));}
    if(!Number(req.params.id)){return res.send({code: 4005, message: 'Invalid Webhook Id.'})}
    
    let payload : any = decoded.payload; let id = payload.user.id;

    db.serialize(() => {
        db.all(`SELECT * FROM webhook WHERE WebhookID=${req.params.id}`,(err,row) => {
            if(!row[0])return res.send({code: 4005, message: 'Webhook invalid.'})
            if(id == row[0].UserID){
                db.exec(`DELETE FROM webhook WHERE WebhookID=${req.params.id}`)
                res.send({code: 200, message:'OK'});
            }
        });
    });
});

router.get('/webhook/:id/messages',async(req: Request<{id: number}>, res:Response,next: NextFunction) => {
    let token = req.headers.authorization;
    if(token == undefined)return res.send(JSON.stringify({code: '403', message: 'Access denied.'}));
    const decoded = jwt.decode(token, {complete: true});
    if (decoded === null) {return res.status(401).send(JSON.stringify({code: '403', message: 'Access denied.'}));}
    if(!Number(req.params.id)){return res.send({code: 4005, message: 'Invalid Webhook Id.'})}
    
    let payload : any = decoded.payload; let id = payload.user.id;

    db.serialize(() => {
        db.all(`SELECT * FROM webhook WHERE WebhookID=${req.params.id}`,(err,row) => {
            if(!row[0])return res.send({code: 4005, message: 'Webhook invalid.'})
            if(id == row[0].UserID){
                db.all(`SELECT * FROM message WHERE WebhookID=${req.params.id}`,async(err,row) => {
                    var messages: any[] = [];
                    row.forEach(message => {messages.push(message)});
                    await res.send({messages:messages});
                });
            }else{
                return res.send(JSON.stringify({code: '403', message: 'Access denied.'}));
            }
        })
    })
})

router.get('/',(req: Request, res:Response,next: NextFunction) => {
    res.send('Welcome!');
});

export default router;