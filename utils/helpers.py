import re

def compile_list_regex():
    bullet  = r'[•·●○\-\\*]'
    decimal = r'\d+\.'
    roman   = r'M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})\.'
    letter  = r'[A-Za-z]\.'
    return re.compile(
        rf'^(?P<indent>\s*)(?P<marker>{bullet}|{decimal}|{roman}|{letter})\s+'
    )
