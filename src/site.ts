import { bindApprovedSlot } from './approved'
import './ground'
import './page.css'

document.querySelectorAll<HTMLElement>('.approved-slot').forEach(bindApprovedSlot)
