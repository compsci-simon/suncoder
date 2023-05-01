def f():
    a = 1
    for i in range(1000):
        a += 1
    array = []
    for i in range(1000):
        array.append(a)
    if a is None:
        pass
    else:
        print('a is not None')
