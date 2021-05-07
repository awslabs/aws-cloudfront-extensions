#!/bin/bash
q_url="https://sqs.us-east-1.amazonaws.com/971945858188/serverless-load-balancer-ServerLoadQueue-1I2DJXNZBTRRC"
server_ip=$(curl http://169.254.169.254/latest/meta-data/public-ipv4)
dns=$(curl http://169.254.169.254/latest/meta-data/public-hostname)
echo public ip address is : $server_ip

for i in {1..10000}
do
    requests_active=$(netstat -ant | grep ESTABLISHED | wc -l)
    var=$(netstat --interfaces=eth0 | tail -1 |awk '{ print $3,$7;}')
    vars=( $var )
    rx=${vars[0]}
    tx=${vars[1]}
    cpu_usage=30
    mem_usage=20
    ts=$(date -d "+2 min" +%s)
    JSON="{\"ip\": \"$server_ip\", \"ts\": \"$ts\", \"requests_active\": \"$requests_active\", \"requests_new\": \"$requests_active\", \"network_out\": \"$tx\", \"network_in\": \"$rx\", \"cpu_usage\": \"$cpu_usage\",\"dns\": \"$dns\", \"mem_usage\": \"$mem_usage\"}"
    aws sqs send-message --queue-url $q_url --message-body "$JSON"
    sleep 60s
done