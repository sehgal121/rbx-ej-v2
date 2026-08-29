import { bindApprovedSlot } from './approved'
import { mountContact } from './contact'
import './ground.css'
import './page.css'

document.querySelectorAll<HTMLElement>('.approved-slot').forEach(bindApprovedSlot)
mountContact()
