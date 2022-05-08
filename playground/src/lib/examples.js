export default {
  factorial: `(define (factorial x)
  (define (fact-iter a product)
    (if (= a 0)
      product
      (fact-iter (- a 1) (* product a))))
  (fact-iter x 1))

(factorial 5)`,
  fibonacci: `(define (fibonacci n)
  (if (or (= n 0) (= n 1))
    1
    (+ (fibonacci (- n 1))
       (fibonacci (- n 2)))))`,
};