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

  empty: ""
};