
#! /bin/bash
 
cd node_modules
mv -rf jwk-to-pem ../
mv -rf jsonwebtoken ../
rm -rf *
mv ../jwk-to-pem ./
mv ../jsonwebtoken ./
