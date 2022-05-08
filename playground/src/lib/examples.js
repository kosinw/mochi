export default {
  factorial: `
(define (factorial x)
  (begin
  (define (fact-iter a product)
    (if (= a 0)
      product
      (fact-iter (- a 1) (* product a))))
  (fact-iter x 1)
))

(factorial 5)`,
  fibonacci: `
(define (fibonacci n)
  (if (or (= n 0) (= n 1))
    1
    (+ (fibonacci (- n 1))
       (fibonacci (- n 2)))))`,
  scoping: `
(define x 1)
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

  composition: `
  (define (square x) (* x x))

  (define (compose f g)
    (lambda (x y)
      (f (g x y))
    )
  )
  
  ((compose square +) 9 10)`,

  redifinePrimitives: `
(print (number? 'a))
(print (number? 2))

(define number? (lambda (x) #t))

(number? 'a)
  `,

  empty: ""
};

//Header dont compile
// ;;;
// ;;; File: examples/fibonacci.scm 
// ;;; Copyright (c) 2022 Kosi Nwabueze and Anirudh Rahul
// ;;;
// ;;; This program is free software: you can redistribute it and/or modify
// ;;; it under the terms of the GNU Lesser General Public License as published by
// ;;; the Free Software Foundation, either version 3 of the License, or
// ;;; (at your option) any later version.
// ;;;
// ;;; This program is distributed in the hope that it will be useful,
// ;;; but WITHOUT ANY WARRANTY; without even the implied warranty of
// ;;; MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// ;;; GNU General Public License for more details.
// ;;;
// ;;; You should have received a copy of the GNU Lesser General Public License
// ;;; along with this program.  If not, see <https://www.gnu.org/licenses/>.
// ;;;