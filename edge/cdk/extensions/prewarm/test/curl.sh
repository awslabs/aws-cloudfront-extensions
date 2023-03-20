#!/bin/bash
distribution="d3jfoo97ao3efx"
cname="prewarm.test.demo.solutions.aws.a2z.org.cn"
for pop in `cat ./pop.list`
do
    #popip=`dig +short ${distribution}.${pop}.cloudfront.net`
    popiplist=`dig +short ${distribution}.${pop}.cloudfront.net`
    #popip= `echo ${popiplist} | awk {'print $1'}`
    array=($popiplist)
    popip=${array[0]}
    #echo ${popip}
    for file in `cat ./prewarm.list`
    do
#        curl -s -D - -w "dns: %{time_namelookup}, tcp_estb: %{time_connect}, ssl: %{time_appconnect}, http_code: %{http_code}, starttrans %{time_starttransfer}, total: %{time_total}, DLsize: %{size_download}, DLspd: %{speed_download}, r_ip: %{remote_ip}\n" --resolve ${cname}:443:${popip} -H "Host: ${cname}" -o /dev/null "https://${cname}/$file" 1>>out.log 2>&1
#        curl -s -D - --resolve ${cname}:443:${popip} -H "Host: ${cname}" -o /dev/null "https://${cname}/$file"
        curl  -D - -H "Host: ${cname}" -H "Accept-Encoding: gzip, deflate, br" -o aaa.jpg "https://${cname}/$file"
    done
done