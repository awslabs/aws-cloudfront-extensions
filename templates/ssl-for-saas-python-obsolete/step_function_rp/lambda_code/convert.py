#!/usr/bin/python
# -*- coding: utf-8  -*-
import re
import sys

if sys.version_info[0] > 2:
    unichr = chr

def make_compatible(src):
    delim = src[0]
    length = 1
    while True:
        length = src.index(delim, length)
        cursor = 0  # number of backslashes immediately before
        while src[length - cursor - 1] == '\\':
            cursor += 1
        if cursor % 2 == 0:
            break

    switches = set(src[length + 1:])
    flags = 0
    if 's' in switches:
        flags |= re.DOTALL
    if 'u' in switches:
        flags |= re.UNICODE
    # TODO: Handle 'D'
    src = src[1:length]
    
    compatible = u''
    last = 0
    for match in re.finditer(r'\\x(?:([0-9a-fA-F]{1,2})|\{([0-9a-fA-F]+)\})', src):
        compatible += u'{0}{1}'.format(src[last:match.start()],
                                       unichr(int(match.group(1) or match.group(2), 16)))
        last = match.end()
    compatible += src[last:]
    return re.compile(compatible, flags)

b = '^(?:\*\.)*(?:_?(?>[a-z\d][a-z\d-]{0,61}[a-z\d]|[a-z\d])\.)*(?:_?(?>[a-z\d][a-z\d-]{0,61}[a-z\d]|[a-z\d]))\.?$'

print(make_compatible(b))
