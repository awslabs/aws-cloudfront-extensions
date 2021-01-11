def get_content_from_file(file_name):
    f = open(file_name, "r")
    process_lines = f.readlines()
    file_content = ''
    for line in process_lines:
        file_content += line

    f.close()
    return file_content
