export default {
  factorial: `(define (factorial x)
  (begin
    (define (fact-iter a product)
      (if (= a 0)
        product
        (fact-iter (- a 1) (* product a))))
    (fact-iter x 1)))

(factorial 5)`,
  fibonacci: `(define (fibonacci n)
  (if (<= n 2)
    1
    (+ (fibonacci (- n 1))
       (fibonacci (- n 2)))))

(fibonacci 20) ;; 6765`,
  scoping: `(define x 1)
(define (setX)
  (set! x 10)
)

(define (setInnerX)
  (define x 2)
  (set! x 3)
)

(print x)
(setX)
(print x)
(setInnerX)
(print x)`,

  composition: `(define (square x) (* x x))

(define (compose f g)
  (lambda (x y)
    (f (g x y))
  )
)

((compose square +) 9 10)`,

  redefinePrimitives: `(print (number? 'a))
(print (number? 2))

(define number? (lambda (x) #t))

(number? 'a)
  `,

  churchPairs: `(define cons
  (lambda (x y)
    (lambda (msg)
      (if (= msg 0) x y))))

(define car
  (lambda (pair)
    (pair 0)))

(define cdr
  (lambda (pair)
    (pair 1)))

(define (compose f g)
  (lambda (x)
    (f (g x))))

(define cadr
  (compose car cdr))

(define the-list (cons 2 (cons 3 (cons 4 (cons 5 ())))))

(define (map f l)
  (if (null? l)
    ()
    (cons
      (f (car l))
      (map f (cdr l)))))

(define (square x) (* x x))

(define perfect-squares (map square the-list))

(map print perfect-squares)`,

  folding: `(define cons
  (lambda (x y)
    (lambda (msg)
      (if (= msg 0) x y))))

(define car
  (lambda (pair)
    (pair 0)))

(define cdr
  (lambda (pair)
    (pair 1)))

(define (compose f g)
  (lambda (x)
    (f (g x))))

(define cadr
  (compose car cdr))

(define (foldl kons a lst)
  (if (null? lst)
    a
    (foldl kons 
      (kons a (car lst))
      (cdr lst))))

(define (foldr kons a lst)
  (if (null? lst)
    a
    (kons (car lst)
          (foldr kons a (cdr lst)))))

(define (map fun lst)
  (foldr (lambda (x a) (cons (fun x) a)) () lst))

(define (xcons car cdr)
  (cons cdr car))

(define (reverse lst)
  (foldl xcons () lst))

(define (for-each fun lst)
  (map 
    (lambda (x) (begin (fun x)))
    (reverse lst))
  ())

(define (filter fun lst)
  (foldr 
    (lambda (x a)
      (if (fun x)
        (cons x a)
        a))
    () lst))

(define the-list (cons 2 (cons 3 (cons 4 (cons 5 ())))))

(define (square x) (* x x))

(define perfect-squares (map square the-list))

(for-each print perfect-squares)
(for-each print (reverse perfect-squares))`,

  empty: ""
};