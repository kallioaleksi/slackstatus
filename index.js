#!/usr/local/bin/node

let args = process.argv.slice(2);
let preset = args[0];
let emoji = args[1];
let message = args[2];

if(typeof preset !== "undefined") {
    missingParams(3);
}


let missingParams = (count) => {
    console.log(count + " missing params!");
}