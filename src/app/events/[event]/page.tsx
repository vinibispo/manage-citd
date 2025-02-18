"use client"

import { useDeferredValue, useState } from "react"
import Link from "next/link"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { TableParticipants } from "./table-participants"
import { Button, Checkbox, Input } from "@/components"
import { Filter as FilterIcon } from "lucide-react"
import {
  getParticipants,
  setSelectedParticipants,
  checkParticipant,
} from "./participants/data-participants"
import { getRandomInteger } from "./get-random-integer"

type EventProps = {
  params: {
    event: string
  }
}

type GenerateGroupsInput = {
  event: string
  ids: Set<string>
}
const generateGroups = async ({ event, ids }: GenerateGroupsInput) => {
  return setSelectedParticipants({ event, ids: Array.from(ids) })
}

export default function Event({ params }: EventProps) {
  const { event } = params

  const [value, setValue] = useState("")
  const deferredValue = useDeferredValue(value)

  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ["participants", { event }],
    queryFn: () => getParticipants(event),
  })

  const generateGroupsMutation = useMutation({
    mutationFn: generateGroups,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["participants", { event }] })
    },
  })

  const checkParticipantMutation = useMutation({
    mutationFn: checkParticipant,
  })

  const handleCheckParticipant = ({
    id,
    checked,
  }: {
    id: string
    checked: boolean
  }) => {
    checkParticipantMutation.mutate({ id, checked, event })
  }

  const participants = query.data ?? []
  const filteredParticipants = participants.filter((p) => {
        if (deferredValue === "") return true

        const name = p.name.toLowerCase()
        const email = p.email.toLowerCase()
        const github = p.github.toLowerCase()

        const search = deferredValue.toLowerCase()

        return (name.includes(search) || email.includes(search) || github.includes(search))
      })

  const handleGenerateGroups = () => {
    const selected = new Set<string>()
    const checkedParticipants = filteredParticipants.filter((p) => p.wannaPlay)
    if (checkedParticipants.length < 16) {
      // TODO: Mostrar erro na tela
      console.log("Não tem a quantidade mínima selecionada")
      return
    }

    while (selected.size < 16) {
      const rnd = getRandomInteger(filteredParticipants.length - 1)
      const participant = filteredParticipants[rnd]
      if (participant.wannaPlay) {
        selected.add(filteredParticipants[rnd].id)
      }
    }
    generateGroupsMutation.mutate({ event, ids: selected })
  }

  return (
    <main className="pb-8 font-sans">
      <div className="mb-8 flex justify-between">
        <h1 className="text-[2.0rem] font-bold text-neutral-900">
          Code in the Dark {event}
        </h1>
        <nav>
          <ul className="flex gap-3">
            <li>
              <Button variant="text">Importar CSV</Button>
            </li>
            <li>
              <Button asChild>
                <Link href={`/events/${event}/participants/new`}>
                  Novo Participante
                </Link>
              </Button>
            </li>
          </ul>
        </nav>
      </div>

      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-[210px]">
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              icon={
                <FilterIcon className="h-[16px] w-[16px] text-neutral-500" />
              }
              placeholder="Buscar Participante"
            />
          </div>
          <div>
            <div className="flex gap-1">
              <Checkbox id="raffle-participants" />
              <label
                htmlFor="raffle-participants"
                className="text-[1.2rem] font-normal text-neutral-500"
              >
                Participantes do Sorteio
              </label>
            </div>
          </div>
        </div>
        <div>
          <Button variant="text" onClick={handleGenerateGroups}>
            Gerar chaves
          </Button>
        </div>
      </div>

      <TableParticipants
        event={event}
        participants={filteredParticipants}
        onCheckParticipant={handleCheckParticipant}
      />
    </main>
  )
}
