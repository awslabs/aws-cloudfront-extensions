
# convert string into binary file
def convert_string_to_file(string, file_name):
    """[summary]
    Args:
        string ([type]): [description]
        file_name ([type]): [description]

    Returns:
        [type]: [description]
    """
    with open(file_name, 'wb') as f:
        f.write(string.encode('utf-8'))
        