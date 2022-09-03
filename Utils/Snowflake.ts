export default function SnowFlake(){
    var date = Date.now();
    var id = Math.floor(Math.random() * (999999999999999999 - 0 + 100000000000000000)) + 100000000000000000;
    return id+date;
}
