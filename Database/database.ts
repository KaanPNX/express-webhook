import * as sqlite from 'sqlite3';
const db = new sqlite.Database('test.sqlite');
import * as fs from 'fs';

new Promise((resolve, reject) => {
    return fs.readdir(__dirname + '/Tables', (err: any, filenames: string[]) => err != null ? reject(err) : resolve(filenames))
}).then((filenames: any) => {
    filenames.forEach((data: string) => {
        fs.readFile(__dirname + '/Tables/'+data,'utf-8',(err:any, datax: string) => { 
            db.serialize(() => {
                db.run(datax);
            });
        });
    });
}); 

export default db;